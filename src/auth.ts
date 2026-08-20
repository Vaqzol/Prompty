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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError('กรุณากรอกอีเมลและรหัสผ่าน');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
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

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, status: true },
          });
          (session.user as any).role = dbUser?.role || (token.role as string) || 'USER';
          (session.user as any).status = dbUser?.status || 'ACTIVE';
        } catch {
          (session.user as any).role = (token.role as string) || 'USER';
          (session.user as any).status = 'ACTIVE';
        }
      }
      return session;
    },
  },
});
