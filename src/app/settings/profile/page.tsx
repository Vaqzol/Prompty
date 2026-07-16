import ProfileSettings from '@/components/settings/ProfileSettings';
import { getUserSettings } from '@/lib/actions/user';
import { redirect } from 'next/navigation';

export default async function SettingsProfilePage() {
  const settings = await getUserSettings();
  if (!settings) redirect('/login');

  return <ProfileSettings settings={settings} />;
}
