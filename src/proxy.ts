import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages ที่ไม่ต้อง login ก็เข้าได้
const publicPaths = [
  '/login',
  '/register',
  '/verify-email',
  '/register/success',
  '/forgot-password',
  '/reset-password',
  '/admin/login',
  '/logo.png',
  '/api/auth',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ถ้าเป็น public path → ผ่านได้เลย
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ตรวจสอบ Session ด้วย NextAuth
  const session = await auth();

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth).*)'],
};
