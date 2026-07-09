import MainNavbar from '@/components/layout/MainNavbar';
import ProfileClient from './ProfileClient';
import { auth } from '@/auth';
import { getUserProfile, getMyPosts } from '@/lib/actions/post';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const profile = await getUserProfile();
  const posts = await getMyPosts();

  if (!profile) redirect('/login');

  return (
    <>
      <MainNavbar user={session.user} />
      <ProfileClient profile={profile} initialPosts={posts} />
    </>
  );
}
