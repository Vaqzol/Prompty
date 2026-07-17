import MainNavbar from '@/components/layout/MainNavbar';
import BookmarksClient from '@/components/bookmarks/BookmarksClient';
import { auth } from '@/auth';
import { getSavedPosts, getCollections } from '@/lib/actions/bookmark';
import { redirect } from 'next/navigation';

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [savedPosts, collections] = await Promise.all([
    getSavedPosts(),
    getCollections(),
  ]);

  return (
    <>
      <MainNavbar user={session.user} />
      <div className="bookmarks-page">
        <BookmarksClient
          posts={savedPosts}
          collections={collections}
          currentUserId={session.user.id}
        />
      </div>
    </>
  );
}
