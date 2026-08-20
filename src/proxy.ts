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
  '/maintenance',
  '/collections',
  '/logo.png',
  '/api/auth',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();
  const user = session?.user as any;
  const userRole = user?.role;
  const userStatus = user?.status;

  // ── 0. Banned User Real-time Check ──
  if (session && userStatus === 'BANNED') {
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login?error=banned', request.url));
    }
  }

  // ── 1. Admin Routes (/admin/*) ──
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      // ถ้าล็อกอินเป็น Admin อยู่แล้ว ให้ส่งไปหน้า /admin ทันที
      if (session && userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    // ต้องล็อกอินและเป็น ADMIN เท่านั้น
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  // ── 2. User Routes (Non-admin) ──
  // ถ้าเป็น public path → ผ่านได้เลย
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // ถ้าผู้ใช้อยู่หน้า /login หรือ /register แต่ล็อกอินอยู่แล้ว
    if (session && (pathname === '/login' || pathname === '/register')) {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // ต้องล็อกอินก่อนเข้าถึงหน้าสำหรับ User
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth|api/upload).*)'],
};
