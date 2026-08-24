import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyMfaLogin } from '@/lib/actions/mfa';
import { encode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // ต้องมี session (login แล้ว แต่ยังไม่ผ่าน MFA)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
    }

    const body = await request.json();
    const { token: otpToken } = body;

    if (!otpToken) {
      return NextResponse.json({ error: 'กรุณากรอกรหัส OTP' }, { status: 400 });
    }

    // ใช้ userId จาก session (server-side) แทนการรับจาก client เพื่อความปลอดภัย
    const userId = session.user.id;
    const result = await verifyMfaLogin(userId, otpToken);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // สร้าง JWT token ใหม่ที่มี mfaVerified: true
    const isProd = process.env.NODE_ENV === 'production';
    const secret = process.env.AUTH_SECRET || 'fallback-secret';

    const newToken = await encode({
      token: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.image,
        role: (session.user as any).role,
        requiresMfa: true,
        mfaVerified: true,
      },
      secret,
      salt: isProd ? '__Secure-authjs.session-token' : 'authjs.session-token',
    });

    const response = NextResponse.json({
      success: true,
      usedBackupCode: result.usedBackupCode,
    });

    // Set new session cookie — ชื่อ cookie ที่ NextAuth v5 ใช้บน Vercel (HTTPS) vs local (HTTP)
    const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';

    response.cookies.set(cookieName, newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 วัน
    });

    return response;
  } catch (e) {
    console.error('MFA verify API error:', e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
