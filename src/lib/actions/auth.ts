'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { randomInt, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { digest, signedDigest, validPassword, emailAddress } from '@/lib/security-tokens';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';

type Purpose = 'register' | 'reset';
const RESET_COOKIE = 'prompty-reset';
const transporter = nodemailer.createTransport({service: 'gmail', auth: {user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS}});
function failure(error: unknown) {
  return {success: false as const, error: error instanceof RateLimitError ? error.message : 'ไม่สามารถดำเนินการได้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่'};
}
function otpHash(email: string, code: string, purpose: Purpose) { return signedDigest(`otp:${purpose}:${email}:${code}`); }

export async function registerUser(data: {name: string; email: string; password: string}) {
  try {
    const email = emailAddress(data.email);
    if (!validPassword(data.password) || typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100) return {success: false, error: 'กรุณากรอกชื่อและรหัสผ่านอย่างน้อย 8 ตัวอักษร (ไม่เกิน 72 ไบต์)'};
    await rateLimit('register', email, 5, 3600);
    const existing = await prisma.user.findUnique({where: {email}});
    if (existing) return {success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือขอรหัสยืนยันใหม่'};
    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.user.create({data: {name: data.name.trim(), email, passwordHash}});
    const result = await sendOtp(email, 'register');
    if (!result.success) return {success: false, error: 'สร้างบัญชีแล้ว แต่ส่งอีเมลไม่สำเร็จ กรุณาขอรหัสยืนยันใหม่'};
    return {success: true};
  } catch (error) { return failure(error); }
}

export async function sendOtp(input: string, purpose: Purpose) {
  try {
    const email = emailAddress(input);
    if (!['register','reset'].includes(purpose)) return {success: false, error: 'ประเภทการยืนยันไม่ถูกต้อง'};
    await rateLimit('otp-send-minute', email, 1, 60);
    await rateLimit('otp-send-hour', email, 5, 3600);
    await rateLimit('otp-send-total', 'all', 100, 3600);
    const user = await prisma.user.findUnique({where: {email}});
    // Same response for unknown or ineligible accounts.
    if (!user || user.status !== 'ACTIVE' || (purpose === 'register' && user.emailVerified)) return {success: true};
    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const stored = await prisma.$transaction(async tx => {
      await tx.otpCode.deleteMany({where: {email}});
      return tx.otpCode.create({data: {email, code: otpHash(email, code, purpose), expiresAt}});
    });
    try {
      await transporter.sendMail({from: `"Prompty" <${process.env.EMAIL_USER}>`, to: email,
        subject: purpose === 'register' ? 'ยืนยันอีเมลของคุณ - Prompty' : 'รีเซ็ตรหัสผ่าน - Prompty',
        text: `รหัสยืนยันของคุณคือ ${code}\nรหัสนี้มีอายุ 10 นาที หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้`,
      });
    } catch {
      await prisma.otpCode.deleteMany({where: {id: stored.id}});
      return {success: false, error: 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่ภายหลัง'};
    }
    return {success: true};
  } catch (error) { return failure(error); }
}

export async function verifyOtp(input: string, code: string, purpose: Purpose = 'register') {
  try {
    const email = emailAddress(input);
    if (!['register','reset'].includes(purpose) || typeof code !== 'string' || !/^\d{6}$/.test(code)) return {success: false, error: 'รหัส OTP ไม่ถูกต้อง'};
    await rateLimit('otp-verify', email, 10, 900);
    const rawGrant = randomBytes(32).toString('hex');
    await prisma.$transaction(async tx => {
      const record = await tx.otpCode.findFirst({where: {email, code: otpHash(email, code, purpose), expiresAt: {gt: new Date()}}});
      if (!record) throw new Error('Invalid OTP');
      // Conditional delete is the single-use gate for concurrent submissions.
      const consumed = await tx.otpCode.deleteMany({where: {id: record.id, expiresAt: {gt: new Date()}}});
      if (consumed.count !== 1) throw new Error('OTP already used');
      const user = await tx.user.findUnique({where: {email}});
      if (!user || user.status !== 'ACTIVE') throw new Error('Invalid user');
      if (purpose === 'register') {
        await tx.user.update({where: {id: user.id}, data: {emailVerified: new Date()}});
      } else {
        await tx.verificationToken.deleteMany({where: {identifier: 'reset:' + email}});
        await tx.verificationToken.create({data: {identifier: 'reset:' + email, token: digest(rawGrant), expires: new Date(Date.now() + 10 * 60 * 1000)}});
      }
    });
    if (purpose === 'reset') {
      (await cookies()).set(RESET_COOKIE, rawGrant, {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/reset-password', maxAge: 600});
    }
    return {success: true};
  } catch (error) { return error instanceof RateLimitError ? failure(error) : {success: false, error: 'รหัส OTP ไม่ถูกต้อง หมดอายุ หรือถูกใช้แล้ว'}; }
}

export async function resetPassword(input: string, newPassword: string) {
  try {
    const email = emailAddress(input);
    if (!validPassword(newPassword)) return {success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์'};
    await rateLimit('password-reset', email, 5, 900);
    const jar = await cookies();
    const grant = jar.get(RESET_COOKIE)?.value;
    if (!grant || !/^[a-f0-9]{64}$/.test(grant)) return {success: false, error: 'กรุณายืนยัน OTP ก่อนตั้งรหัสผ่านใหม่'};
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction(async tx => {
      const consumed = await tx.verificationToken.deleteMany({where: {identifier: 'reset:' + email, token: digest(grant), expires: {gt: new Date()}}});
      if (consumed.count !== 1) throw new Error('Invalid reset grant');
      await tx.user.update({where: {email}, data: {passwordHash}});
    });
    jar.set(RESET_COOKIE, '', {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/reset-password', maxAge: 0});
    return {success: true};
  } catch (error) { return error instanceof RateLimitError ? failure(error) : {success: false, error: 'สิทธิ์ตั้งรหัสผ่านหมดอายุหรือถูกใช้แล้ว กรุณาขอ OTP ใหม่'}; }
}

export async function forgotPassword(email: string) { return sendOtp(email, 'reset'); }

// Kept for existing forms; this preflight does not create a session.
export async function authenticate(data: {email: string; password: string}) {
  try {
    const email = emailAddress(data.email);
    await rateLimit('login-preflight', email, 10, 900);
    if (typeof data.password !== 'string' || Buffer.byteLength(data.password, 'utf8') > 72) return {error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'};
    const user = await prisma.user.findUnique({where: {email}});
    if (!user?.passwordHash || !await bcrypt.compare(data.password, user.passwordHash)) return {error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'};
    if (!user.emailVerified) return {error: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ'};
    if (user.status !== 'ACTIVE') return {error: 'บัญชีไม่สามารถใช้งานได้'};
    return {success: true};
  } catch (error) { return {error: failure(error).error}; }
}
