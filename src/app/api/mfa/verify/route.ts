import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyMfaLogin } from '@/lib/actions/mfa';
import { encode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token: otpToken } = await request.json();
    if (!otpToken) {
      return NextResponse.json({ error: 'กรุณากรอกรหัส OTP' }, { status: 400 });
    }

    const result = await verifyMfaLogin(session.user.id, otpToken);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // สร้าง new JWT token ที่มี mfaVerified: true
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
      secret: process.env.AUTH_SECRET || 'fallback-secret',
      salt: 'authjs.session-token',
    });

    const response = NextResponse.json({
      success: true,
      usedBackupCode: result.usedBackupCode,
    });

    // Set the new session cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';

    response.cookies.set(cookieName, newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (e) {
    console.error('MFA verify API error:', e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
