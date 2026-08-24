import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyMfaLogin } from '@/lib/actions/mfa';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // ต้องมี session (login แล้ว)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
    }

    const body = await request.json();
    const { token: otpToken } = body;

    if (!otpToken) {
      return NextResponse.json({ error: 'กรุณากรอกรหัส OTP' }, { status: 400 });
    }

    // ตรวจสอบ OTP หรือ Backup Code
    const result = await verifyMfaLogin(session.user.id, otpToken);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // ✅ บันทึกเวลา verify ลง DB — session callback จะอ่านค่านี้แทนการ re-encode JWT
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaVerifiedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      usedBackupCode: result.usedBackupCode,
    });
  } catch (e) {
    console.error('MFA verify API error:', e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
