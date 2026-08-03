import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// ใช้ Proxy เพื่อให้แน่ใจว่าได้ PrismaClient instance ล่าสุดเสมอ แม้จะมีการ generate schema ใหม่ในขณะ dev
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'production') {
      if (!global.prisma) global.prisma = createPrismaClient();
      return (global.prisma as any)[prop];
    }

    if (
      !global.prisma ||
      (typeof prop === 'string' &&
        !(global.prisma as any)[prop] &&
        prop !== 'then' &&
        prop !== 'toJSON' &&
        prop !== 'catch' &&
        prop !== 'toString')
    ) {
      global.prisma = createPrismaClient();
    }
    return (global.prisma as any)[prop];
  },
});

