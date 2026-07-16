import NotificationSettings from '@/components/settings/NotificationSettings';
import { getUserSettings } from '@/lib/actions/user';
import { redirect } from 'next/navigation';

export default async function SettingsNotificationsPage() {
  const settings = await getUserSettings();
  if (!settings) redirect('/login');

  return <NotificationSettings settings={settings} />;
}
