import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages ที่ไม่ต้อง login ก็เข้าได้
const publicPaths = ['/login', '/register', '/verify-email', '/register/success', '/logo.png'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ถ้าเป็น public path → ผ่านได้เลย
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // เช็ค cookie ว่า login อยู่ไหม (ใช้ mock cookie ชื่อ "auth_token")
  const isLoggedIn = request.cookies.get('auth_token');

  // ถ้ายังไม่ login → redirect ไป /login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // จับ path เหล่านี้ทั้งหมด (ยกเว้น static files และ logo)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api).*)'],
};
