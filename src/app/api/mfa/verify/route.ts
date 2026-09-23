import { NextRequest, NextResponse } from 'next/server';
import { verifyMfaLogin } from '@/lib/actions/mfa';
import { requireSession, AccessError } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({error: 'คำขอไม่ถูกต้อง'}, {status: 403});
    await requireSession(true);
    const body = await request.json();
    if (typeof body?.token !== 'string') return NextResponse.json({error: 'กรุณากรอกรหัส OTP'}, {status: 400});
    const result = await verifyMfaLogin(body.token);
    return NextResponse.json(result, {status: result.success ? 200 : result.retryAfter ? 429 : 400, headers: !result.success && result.retryAfter ? {'Retry-After': String(result.retryAfter)} : undefined});
  } catch (error) {
    return NextResponse.json({error: error instanceof AccessError ? error.message : 'ไม่สามารถยืนยันได้ กรุณาลองใหม่'}, {status: error instanceof AccessError ? error.status : 400});
  }
}
