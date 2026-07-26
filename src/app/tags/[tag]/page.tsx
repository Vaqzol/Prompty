import MainNavbar from '@/components/layout/MainNavbar';
import TagDetailClient from './TagDetailClient';
import { auth } from '@/auth';
import { getPostsByTag, getTopContributors } from '@/lib/actions/trending';

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export default async function TagDetailPage({ params }: TagPageProps) {
  const session = await auth();
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  const [posts, contributors] = await Promise.all([
    getPostsByTag(decodedTag, 'week'),
    getTopContributors(5),
  ]);

  return (
    <>
      <MainNavbar user={session?.user} />
      <TagDetailClient
        tag={decodedTag}
        initialPosts={posts}
        contributors={contributors}
        currentUserId={session?.user?.id}
      />
    </>
  );
}
