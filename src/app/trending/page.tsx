import MainNavbar from '@/components/layout/MainNavbar';
import TrendingClient from './TrendingClient';
import { auth } from '@/auth';
import { getTrendingPosts, getTopContributors } from '@/lib/actions/trending';

export default async function TrendingPage() {
  const session = await auth();
  const [posts, contributors] = await Promise.all([
    getTrendingPosts('all'),
    getTopContributors(5),
  ]);

  return (
    <>
      <MainNavbar user={session?.user} />
      <TrendingClient
        initialPosts={posts}
        contributors={contributors}
        currentUserId={session?.user?.id}
      />
    </>
  );
}
