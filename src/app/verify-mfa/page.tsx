import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import VerifyMfaClient from './VerifyMfaClient';

export default async function VerifyMfaPage() {
  const session = await auth();

  // ถ้าไม่มี session → ส่งกลับไป login
  if (!session?.user?.id) {
    redirect('/login');
  }

  const requiresMfa = (session.user as any)?.requiresMfa;
  const mfaVerified = (session.user as any)?.mfaVerified;

  // ถ้า MFA ไม่ required หรือ verified แล้ว → ไม่ต้องอยู่หน้านี้
  if (!requiresMfa || mfaVerified) {
    redirect('/');
  }

  return <VerifyMfaClient userId={session.user.id} />;
}
