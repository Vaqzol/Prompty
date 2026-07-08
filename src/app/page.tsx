import MainNavbar from '@/components/layout/MainNavbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import FeedContent from '@/components/feed/FeedContent';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <>
      <MainNavbar user={session?.user} />
      <div className="main-layout">
        <LeftSidebar />
        <FeedContent />
        <RightSidebar />
      </div>
    </>
  );
}
