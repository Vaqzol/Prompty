import MainNavbar from '@/components/layout/MainNavbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import FeedContent from '@/components/feed/FeedContent';
import { auth } from '@/auth';
import { getPosts } from '@/lib/actions/post';

export default async function HomePage() {
  const session = await auth();
  const posts = await getPosts();

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
