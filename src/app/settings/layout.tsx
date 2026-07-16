import MainNavbar from '@/components/layout/MainNavbar';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <>
      <MainNavbar user={session.user} />
      <div className="settings-page">
        <div className="settings-container">
          <SettingsSidebar />
          <div className="settings-content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
