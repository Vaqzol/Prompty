import MainNavbar from '@/components/layout/MainNavbar';
import BookmarksClient from '@/components/bookmarks/BookmarksClient';
import { auth } from '@/auth';
import { getSavedPosts } from '@/lib/actions/bookmark';
import { redirect } from 'next/navigation';

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const savedPosts = await getSavedPosts();

  return (
    <>
      <MainNavbar user={session.user} />
      <div className="bookmarks-page">
        <BookmarksClient posts={savedPosts} currentUserId={session.user.id} />
      </div>
    </>
  );
}
