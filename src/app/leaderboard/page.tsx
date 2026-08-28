import MainNavbar from '@/components/layout/MainNavbar';
import LeaderboardClient from './LeaderboardClient';
import { auth } from '@/auth';
import { getLeaderboard, getCurrentUserRank } from '@/lib/actions/trending';

export default async function LeaderboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [leaderboard, currentUserRank] = await Promise.all([
    getLeaderboard('all', 20),
    userId ? getCurrentUserRank(userId, 'all') : Promise.resolve(null),
  ]);

  return (
    <>
      <MainNavbar user={session?.user} />
      <LeaderboardClient
        initialLeaderboard={leaderboard}
        initialCurrentUserRank={currentUserRank}
        currentUserId={userId}
      />
    </>
  );
}
