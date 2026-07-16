import AppearanceSettings from '@/components/settings/AppearanceSettings';
import { getUserSettings } from '@/lib/actions/user';
import { redirect } from 'next/navigation';

export default async function SettingsAppearancePage() {
  const settings = await getUserSettings();
  if (!settings) redirect('/login');

  return <AppearanceSettings settings={settings} />;
}
