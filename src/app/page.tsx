import MainNavbar from '@/components/layout/MainNavbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import FeedContent from '@/components/feed/FeedContent';
import { auth } from '@/auth';
import { getPosts } from '@/lib/actions/post';

export const revalidate = 30; // ISR: revalidate ทุก 30 วินาที

export default async function HomePage() {
  // ✅ Parallel fetch — auth + posts พร้อมกัน
  const [session, posts] = await Promise.all([
    auth(),
    getPosts(),
  ]);

  return (
    <>
      <MainNavbar user={session?.user} />
      <div className="main-layout">
        <LeftSidebar />
        <FeedContent posts={posts} currentUserId={session?.user?.id} />
        <RightSidebar />
      </div>
    </>
  );
}
