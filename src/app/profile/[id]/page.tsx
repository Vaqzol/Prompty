import MainNavbar from '@/components/layout/MainNavbar';
import PublicProfileClient from './PublicProfileClient';
import { auth } from '@/auth';
import { getUserPublicProfile, getUserPosts } from '@/lib/actions/post';
import { getPublicCollectionsByUser } from '@/lib/actions/bookmark';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  
  // ถ้าเป็น profile ตัวเองให้ redirect ไปหน้า /profile
  if (session?.user?.id === id) {
    redirect('/profile');
  }

  const profile = await getUserPublicProfile(id);
  if (!profile) notFound();

  const posts = await getUserPosts(id);
  const collections = await getPublicCollectionsByUser(id);

  // เช็คว่า user ปัจจุบัน follow คนนี้อยู่ไหม
  let initialIsFollowing = false;
  if (session?.user?.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: id,
        },
      },
    });
    initialIsFollowing = !!follow;
  }

  return (
    <>
      <MainNavbar user={session?.user} />
      <PublicProfileClient 
        profile={profile} 
        initialPosts={posts} 
        initialCollections={collections}
        initialIsFollowing={initialIsFollowing} 
        currentUserId={session?.user?.id}
      />
    </>
  );
}
