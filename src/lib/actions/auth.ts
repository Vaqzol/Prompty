'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────────
// 1. สมัครสมาชิก
// ─────────────────────────────────────────────
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
  });

  // ส่ง OTP ยืนยันอีเมลไปทันที
  const otpResult = await sendOtp(data.email, 'register');
  if (!otpResult.success) {
    return { success: false, error: 'สมัครสมาชิกสำเร็จ แต่ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่' };
  }

  return { success: true };
}

// ─────────────────────────────────────────────
// 2. สร้างและส่ง OTP
// ─────────────────────────────────────────────
export async function sendOtp(email: string, purpose: 'register' | 'reset') {
  // ลบ OTP เก่าของอีเมลนี้ออก
  await prisma.otpCode.deleteMany({ where: { email } });

  // สร้างรหัส 6 หลัก
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // หมดอายุใน 10 นาที
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpCode.create({
    data: { email, code, expiresAt },
  });

  const subject =
    purpose === 'register'
      ? 'ยืนยันอีเมลของคุณ - Prompty'
      : 'รีเซ็ตรหัสผ่าน - Prompty';

  const headingText =
    purpose === 'register' ? 'ยืนยันการสมัครสมาชิก' : 'รีเซ็ตรหัสผ่าน';

  const bodyText =
    purpose === 'register'
      ? 'ใช้รหัส OTP ด้านล่างเพื่อยืนยันอีเมลของคุณ'
      : 'ใช้รหัส OTP ด้านล่างเพื่อตั้งรหัสผ่านใหม่';

  try {
    await transporter.sendMail({
      from: `"Prompty 🌊" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8f9fa; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 0;">Prompty 🌊</h1>
          </div>
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px;">${headingText}</h2>
            <p style="color: #65676b; margin: 0 0 24px; font-size: 15px;">${bodyText} รหัสนี้มีอายุ <strong>10 นาที</strong></p>
            <div style="background: #eff6ff; border: 2px dashed #2563eb; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #2563eb;">${code}</span>
            </div>
            <p style="color: #8e8e93; font-size: 13px; margin: 0;">หากคุณไม่ได้ดำเนินการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Nodemailer SMTP Error:', error);
    return { success: false, error: 'ส่งอีเมลไม่สำเร็จ' };
  }
}

// ─────────────────────────────────────────────
// 3. ตรวจสอบ OTP
// ─────────────────────────────────────────────
export async function verifyOtp(email: string, code: string) {
  const otpRecord = await prisma.otpCode.findFirst({
    where: { email, code },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return { success: false, error: 'รหัส OTP ไม่ถูกต้อง' };
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma.otpCode.delete({ where: { id: otpRecord.id } });
    return { success: false, error: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' };
  }

  // ลบ OTP หลังใช้งาน
  await prisma.otpCode.delete({ where: { id: otpRecord.id } });

  // ถ้าเป็นการยืนยันอีเมลสมัครสมาชิก → อัปเดต emailVerified
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
  }

  return { success: true };
}

// ─────────────────────────────────────────────
// 4. รีเซ็ตรหัสผ่าน (หลังจาก OTP ผ่านแล้ว)
// ─────────────────────────────────────────────
export async function resetPassword(email: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: false, error: 'ไม่พบบัญชีนี้ในระบบ' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// 5. ส่ง OTP ใหม่สำหรับ "ลืมรหัสผ่าน"
// ─────────────────────────────────────────────
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // บอกว่าสำเร็จเสมอเพื่อป้องกันการ enumerate email
    return { success: true };
  }

  await sendOtp(email, 'reset');
  return { success: true };
}

// ─────────────────────────────────────────────
// 6. ตรวจสอบข้อมูลผู้ใช้ (สำหรับหน้า Login)
// ─────────────────────────────────────────────
export async function authenticate(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    return { error: 'ไม่พบบัญชีนี้ในระบบ' };
  }

  if (!user.emailVerified) {
    return { error: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ' };
  }

  const isValidPassword = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!isValidPassword) {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  }

  return { success: true };
}
