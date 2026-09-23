'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';
import { digest, mfaGrant } from '@/lib/security-tokens';
import bcrypt from 'bcryptjs';
import { generateMfaSetupData, verifyTotpToken, generateBackupCodes, hashBackupCodes, encryptSecret, decryptSecret, verifyBackupCode } from '@/lib/mfa';

function errorResult(error: unknown) { return {success: false as const, error: error instanceof RateLimitError ? error.message : 'ไม่สามารถยืนยันได้ กรุณาตรวจสอบรหัสแล้วลองใหม่', retryAfter: error instanceof RateLimitError ? error.retryAfter : undefined}; }

export async function getMfaStatus() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({where: {id: session.user.id}, select: {mfaEnabled: true, mfaBackupCodes: true}});
  return {enabled: user?.mfaEnabled ?? false, hasBackupCodes: !!user?.mfaBackupCodes.length};
}

export async function initMfaSetup() {
  try {
    const session = await requireSession();
    await rateLimit('mfa-setup', session.user.id, 5, 900);
    const user = await prisma.user.findUnique({where: {id: session.user.id}});
    if (!user?.email || user.mfaEnabled) return {success: false as const, error: 'ไม่สามารถเริ่มตั้งค่า 2FA ได้'};
    const {secret, qrCodeUrl} = await generateMfaSetupData(user.email);
    const identifier = 'mfa-setup:' + user.id + ':' + session.user.sessionId;
    await prisma.$transaction(async tx => {
      await tx.verificationToken.deleteMany({where: {identifier}});
      await tx.verificationToken.create({data: {identifier, token: encryptSecret(secret), expires: new Date(Date.now() + 600000)}});
    });
    return {success: true as const, secret, qrCodeUrl};
  } catch (error) { return errorResult(error); }
}

export async function confirmEnableMfa(tempSecret: string, token: string) {
  try {
    const session = await requireSession();
    await rateLimit('mfa-check', session.user.id, 10, 900);
    if (typeof tempSecret !== 'string' || tempSecret.length > 128 || typeof token !== 'string' || !/^\d{6}$/.test(token)) return errorResult(null);
    const backupCodes = generateBackupCodes();
    const hashes = await hashBackupCodes(backupCodes);
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`;
      const user = await tx.user.findUnique({where: {id: session.user.id}});
      if (!user || user.mfaEnabled || user.status !== 'ACTIVE') throw new Error('Invalid setup');
      const identifier = 'mfa-setup:' + user.id + ':' + session.user.sessionId;
      const pending = await tx.verificationToken.findFirst({where: {identifier, expires: {gt: new Date()}}});
      if (!pending || decryptSecret(pending.token) !== tempSecret || !verifyTotpToken(tempSecret, token)) throw new Error('Invalid setup token');
      const encrypted = encryptSecret(tempSecret);
      await tx.user.update({where: {id: user.id}, data: {mfaEnabled: true, mfaSecret: encrypted, mfaBackupCodes: hashes, mfaVerifiedAt: null}});
      await tx.verificationToken.deleteMany({where: {identifier}});
      const grant = mfaGrant(user.id, session.user.sessionId, encrypted);
      await tx.verificationToken.create({data: {...grant, expires: new Date(Date.now() + 30 * 86400000)}});
    });
    return {success: true as const, backupCodes};
  } catch (error) { return errorResult(error); }
}

export async function disableMfa(password: string, token: string) {
  try {
    const session = await requireSession();
    await rateLimit('mfa-check', session.user.id, 10, 900);
    if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 72 || typeof token !== 'string' || !/^\d{6}$/.test(token)) return errorResult(null);
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`;
      const user = await tx.user.findUnique({where: {id: session.user.id}});
      if (!user?.mfaEnabled || !user.mfaSecret || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash) || !verifyTotpToken(decryptSecret(user.mfaSecret), token)) throw new Error('Invalid credentials');
      await tx.user.update({where: {id: user.id}, data: {mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [], mfaVerifiedAt: null}});
      await tx.verificationToken.deleteMany({where: {identifier: {startsWith: 'mfa:' + user.id + ':'}}});
    }, {timeout: 15000});
    return {success: true as const};
  } catch (error) { return errorResult(error); }
}

// Direct Server Action calls receive the same authorization and limits as the API route.
export async function verifyMfaLogin(token: string) {
  try {
    const session = await requireSession(true);
    await rateLimit('mfa-check', session.user.id, 10, 900);
    if (typeof token !== 'string' || !/^(\d{6}|[a-fA-F0-9]{8})$/.test(token)) return errorResult(null);
    const usedBackupCode = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`;
      const user = await tx.user.findUnique({where: {id: session.user.id}});
      if (!user?.mfaEnabled || !user.mfaSecret || user.status !== 'ACTIVE') throw new Error('Invalid user');
      let backup = false;
      if (verifyTotpToken(decryptSecret(user.mfaSecret), token)) {
        // Prevent a valid TOTP being replayed into a second login within its time window.
        const replayToken = digest('mfa-replay:' + user.id + ':' + user.mfaSecret + ':' + token);
        await tx.verificationToken.deleteMany({where: {token: replayToken, expires: {lte: new Date()}}});
        await tx.verificationToken.create({data: {identifier: 'mfa-replay:' + user.id, token: replayToken, expires: new Date(Date.now() + 90000)}});
      } else {
        const index = await verifyBackupCode(token, user.mfaBackupCodes);
        if (index < 0) throw new Error('Invalid code');
        const remaining = user.mfaBackupCodes.filter((_, i) => i !== index);
        await tx.user.update({where: {id: user.id}, data: {mfaBackupCodes: remaining}});
        backup = true;
      }
      const grant = mfaGrant(user.id, session.user.sessionId, user.mfaSecret);
      await tx.verificationToken.upsert({where: {token: grant.token}, create: {...grant, expires: new Date(Date.now() + 30 * 86400000)}, update: {expires: new Date(Date.now() + 30 * 86400000)}});
      return backup;
    }, {timeout: 15000});
    return {success: true as const, usedBackupCode};
  } catch (error) { return errorResult(error); }
}
