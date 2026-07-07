import MainNavbar from '@/components/layout/MainNavbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import FeedContent from '@/components/feed/FeedContent';

export default function HomePage() {
  return (
    <>
      <MainNavbar />
      <div className="main-layout">
        <LeftSidebar />
        <FeedContent />
        <RightSidebar />
      </div>
    </>
  );
}
