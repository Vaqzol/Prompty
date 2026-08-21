import SecuritySettings from '@/components/settings/SecuritySettings';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'ความปลอดภัย — Prompty',
  description: 'จัดการการยืนยันตัวตน 2 ชั้น (2FA/MFA) และความปลอดภัยของบัญชี',
};

export default async function SettingsSecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return <SecuritySettings />;
}
