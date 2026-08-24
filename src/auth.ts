import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

class CustomAuthError extends CredentialsSignin {
  constructor(msg: string) {
    super();
    this.code = msg;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // ช่อง mfaVerified พิเศษสำหรับ step 2 (ไม่แสดงใน UI ปกติ)
        mfaVerified: { label: 'MFA Verified', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError('กรุณากรอกอีเมลและรหัสผ่าน');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true, name: true, email: true, image: true, role: true,
            status: true, emailVerified: true, passwordHash: true, mfaEnabled: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new CustomAuthError('ไม่พบบัญชีนี้ในระบบ');
        }

        if (!user.emailVerified) {
          throw new CustomAuthError('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
        }

        if (user.status === 'BANNED') {
          throw new CustomAuthError('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new CustomAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        // ถ้าเปิด MFA → ส่ง flag กลับเพื่อให้ JWT รู้ว่าต้อง verify OTP ก่อน
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          requiresMfa: user.mfaEnabled,
          mfaVerified: user.mfaEnabled ? false : true, // ถ้าไม่เปิด MFA ถือว่า verified แล้ว
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        token.requiresMfa = (user as any).requiresMfa ?? false;
        token.mfaVerified = (user as any).mfaVerified ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, status: true, mfaEnabled: true, mfaVerifiedAt: true },
          });
          (session.user as any).role = dbUser?.role || (token.role as string) || 'USER';
          (session.user as any).status = dbUser?.status || 'ACTIVE';

          // ── MFA verification check (DB-backed, per-session) ──
          const requiresMfa = dbUser?.mfaEnabled ?? false;
          // เปรียบเทียบกับเวลาที่ JWT นี้ถูกออก (iat) เพื่อให้ verify ทุก login ใหม่
          const sessionIssuedAt = new Date((token.iat as number) * 1000);
          const mfaVerified = !requiresMfa ||
            (dbUser?.mfaVerifiedAt != null && dbUser.mfaVerifiedAt > sessionIssuedAt);
          (session.user as any).requiresMfa = requiresMfa;
          (session.user as any).mfaVerified = mfaVerified;
        } catch {
          (session.user as any).role = (token.role as string) || 'USER';
          (session.user as any).status = 'ACTIVE';
          (session.user as any).requiresMfa = false;
          (session.user as any).mfaVerified = true;
        }
      }
      return session;
    },
  },
});

