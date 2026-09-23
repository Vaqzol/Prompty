import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { credentialVersion, mfaGrant, emailAddress } from '@/lib/security-tokens';
import { rateLimit } from '@/lib/rate-limit';

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
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string' || Buffer.byteLength(credentials.password, 'utf8') > 72) {
          throw new CustomAuthError('กรุณากรอกอีเมลและรหัสผ่าน');
        }

        const email = emailAddress(credentials.email);
        try { await rateLimit('login', email, 10, 900); } catch { throw new CustomAuthError('ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอแล้วลองใหม่'); }
        const user = await prisma.user.findUnique({
          where: { email },
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
          credentialVersion: credentialVersion(user.passwordHash),
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
        token.sessionId = randomUUID();
        token.credentialVersion = user.credentialVersion;
      }
      return token;
    },
    async session({ session, token }) {
      // Old, deleted, revoked and unverifiable sessions fail closed.
      Object.assign(session.user, {id: '', role: 'USER', status: 'INVALID', requiresMfa: true, mfaVerified: false, sessionId: ''});
      if (typeof token.id !== 'string' || typeof token.sessionId !== 'string') return session;
      try {
        const user = await prisma.user.findUnique({where: {id: token.id}, select: {
          role: true, status: true, emailVerified: true, passwordHash: true, mfaEnabled: true, mfaSecret: true,
        }});
        if (!user?.passwordHash || !user.emailVerified || token.credentialVersion !== credentialVersion(user.passwordHash)) return session;
        let verified = !user.mfaEnabled;
        if (user.mfaEnabled && user.mfaSecret) {
          const grant = mfaGrant(token.id, token.sessionId, user.mfaSecret);
          const stored = await prisma.verificationToken.findUnique({where: {token: grant.token}});
          verified = !!stored && stored.identifier === grant.identifier && stored.expires > new Date();
        }
        Object.assign(session.user, {id: token.id, role: user.role, status: user.status,
          requiresMfa: user.mfaEnabled, mfaVerified: verified, sessionId: token.sessionId});
      } catch {
        // Do not grant access when the database or verification service fails.
      }
      return session;
    },
  },
});
