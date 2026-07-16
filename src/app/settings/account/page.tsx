import AccountSettings from '@/components/settings/AccountSettings';
import { getUserSettings } from '@/lib/actions/user';
import { redirect } from 'next/navigation';

export default async function SettingsAccountPage() {
  const settings = await getUserSettings();
  if (!settings) redirect('/login');

  return <AccountSettings settings={settings} />;
}
