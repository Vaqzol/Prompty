import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that do not require authentication
const publicPaths = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-mfa',
  '/register/success',
  '/forgot-password',
  '/reset-password',
  '/admin/login',
  '/maintenance',
  '/collections',
  '/logo.png',
  '/api/auth',
];

async function isMaintenanceModeActive(): Promise<boolean> {
  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { key: 'maintenance_mode' },
    });
    return setting?.value === 'true';
  } catch {
    return false;
  }
}

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
    // Stay on /login with error message, do NOT redirect to /
    return NextResponse.next();
  }

  // ── 0b. MFA Verification Check ──
  const requiresMfa = (user as any)?.requiresMfa;
  const mfaVerified = (user as any)?.mfaVerified;
  if (session && requiresMfa && !mfaVerified) {
    if (
      pathname !== '/verify-mfa' &&
      !pathname.startsWith('/api/auth') &&
      !pathname.startsWith('/api/mfa') && // ← อนุญาตให้เรียก MFA API ได้ขณะรอ verify
      !pathname.startsWith('/api/ai') // ← AI API ใช้ได้ทั้งก่อนและหลัง MFA
    ) {
      return NextResponse.redirect(new URL('/verify-mfa', request.url));
    }
    return NextResponse.next();
  }

  // ── 1. Maintenance Mode Check ──
  const isMaintenance = await isMaintenanceModeActive();
  if (isMaintenance && userRole !== 'ADMIN') {
    // Admins can log in at /admin/login
    if (pathname === '/admin/login' || pathname.startsWith('/admin')) {
      // Allow proceeding to admin auth logic below
    } else if (pathname === '/maintenance') {
      return NextResponse.next();
    } else if (pathname.startsWith('/api/auth') || pathname === '/logo.png') {
      return NextResponse.next();
    } else {
      // Redirect all regular users and guests to /maintenance
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // ── 2. Admin Routes (/admin/*) ──
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      // If already logged in as ADMIN -> send to /admin dashboard
      if (session && userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    // All other /admin/* paths require ADMIN role
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // ── 3. Public Routes ──
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // If already logged in (active) and visiting login/register -> redirect to appropriate home
    if (session && userStatus !== 'BANNED' && (pathname === '/login' || pathname === '/register')) {
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // ── 4. Protected User Routes ──
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api/upload).*)'],
};
