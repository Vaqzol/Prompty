'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  generateMfaSetupData,
  verifyTotpToken,
  generateBackupCodes,
  hashBackupCodes,
  encryptSecret,
  decryptSecret,
  verifyBackupCode,
} from '@/lib/mfa';

// ── Helper: ดึง session ปัจจุบัน ──
async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

// ─────────────────────────────────────────────
// 1. ดึงสถานะ MFA ของผู้ใช้ปัจจุบัน
// ─────────────────────────────────────────────
export async function getMfaStatus(): Promise<{ enabled: boolean; hasBackupCodes: boolean }> {
  const userId = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaBackupCodes: true },
  });
  return {
    enabled: user?.mfaEnabled ?? false,
    hasBackupCodes: (user?.mfaBackupCodes?.length ?? 0) > 0,
  };
}

// ─────────────────────────────────────────────
// 2. เริ่มต้นการตั้งค่า MFA — คืน QR Code + Secret
// ─────────────────────────────────────────────
export async function initMfaSetup(): Promise<{
  success: boolean;
  qrCodeUrl?: string;
  secret?: string;
  error?: string;
}> {
  try {
    const userId = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });
    if (!user?.email) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
    if (user.mfaEnabled) return { success: false, error: 'เปิดใช้ 2FA อยู่แล้ว' };

    const { secret, qrCodeUrl } = await generateMfaSetupData(user.email);
    return { success: true, qrCodeUrl, secret };
  } catch (e) {
    console.error('initMfaSetup error:', e);
    return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

// ─────────────────────────────────────────────
// 3. ยืนยันการเปิด MFA ด้วย OTP
// ─────────────────────────────────────────────
export async function confirmEnableMfa(
  tempSecret: string,
  token: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    const userId = await requireUser();

    // ตรวจสอบ OTP ด้วย temp secret (plain text ที่ client ส่งมา)
    const valid = verifyTotpToken(tempSecret, token);
    if (!valid) return { success: false, error: 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่' };

    // สร้าง backup codes
    const plainBackupCodes = generateBackupCodes();
    const hashedCodes = await hashBackupCodes(plainBackupCodes);

    // บันทึกลง DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: encryptSecret(tempSecret),
        mfaBackupCodes: hashedCodes,
      },
    });

    return { success: true, backupCodes: plainBackupCodes };
  } catch (e) {
    console.error('confirmEnableMfa error:', e);
    return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

// ─────────────────────────────────────────────
// 4. ปิด MFA (ต้องยืนยัน password + OTP)
// ─────────────────────────────────────────────
export async function disableMfa(
  password: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, mfaSecret: true, mfaEnabled: true },
    });

    if (!user?.mfaEnabled) return { success: false, error: 'ยังไม่ได้เปิดใช้ 2FA' };
    if (!user.passwordHash) return { success: false, error: 'ไม่สามารถยืนยันรหัสผ่านได้' };

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };

    const secret = decryptSecret(user.mfaSecret!);
    const totpOk = verifyTotpToken(secret, token);
    if (!totpOk) return { success: false, error: 'รหัส OTP ไม่ถูกต้อง' };

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
    });

    return { success: true };
  } catch (e) {
    console.error('disableMfa error:', e);
    return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

// ─────────────────────────────────────────────
// 5. ตรวจสอบ MFA ระหว่าง Login Flow (จาก /verify-mfa)
// ─────────────────────────────────────────────
export async function verifyMfaLogin(
  userId: string,
  token: string
): Promise<{ success: boolean; usedBackupCode?: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaBackupCodes: true, mfaEnabled: true },
    });

    if (!user?.mfaEnabled || !user.mfaSecret) {
      return { success: false, error: 'ยังไม่ได้เปิดใช้ 2FA' };
    }

    // ลอง TOTP ก่อน
    const secret = decryptSecret(user.mfaSecret);
    const totpOk = verifyTotpToken(secret, token);
    if (totpOk) return { success: true };

    // ลอง Backup Code
    const backupIdx = await verifyBackupCode(token, user.mfaBackupCodes);
    if (backupIdx >= 0) {
      // ตัด backup code ที่ใช้แล้วออก
      const remaining = [...user.mfaBackupCodes];
      remaining.splice(backupIdx, 1);
      await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodes: remaining },
      });
      return { success: true, usedBackupCode: true };
    }

    return { success: false, error: 'รหัส OTP หรือ Backup Code ไม่ถูกต้อง' };
  } catch (e) {
    console.error('verifyMfaLogin error:', e);
    return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}
