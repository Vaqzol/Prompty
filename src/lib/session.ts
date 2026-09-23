import 'server-only';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export class AccessError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function requireSession(allowPendingMfa = false) {
  const session = await auth();
  if (!session?.user?.id) throw new AccessError('กรุณาเข้าสู่ระบบใหม่', 401);
  if (session.user.status !== 'ACTIVE') throw new AccessError('บัญชีไม่สามารถใช้งานได้', 403);
  if (!allowPendingMfa && session.user.requiresMfa && !session.user.mfaVerified) throw new AccessError('กรุณายืนยันตัวตน 2 ชั้นก่อน', 403);
  const maintenance = await prisma.systemSetting.findUnique({where: {key: 'maintenance_mode'}});
  if (maintenance?.value === 'true' && session.user.role !== 'ADMIN') throw new AccessError('ระบบกำลังปรับปรุง กรุณาลองใหม่ภายหลัง', 503);
  return session;
}
// For optional reads; a pending or invalid session is treated as a guest.
export async function verifiedSession() {
  try { return await requireSession(); } catch { return null; }
}
