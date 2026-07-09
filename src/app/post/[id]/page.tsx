import MainNavbar from '@/components/layout/MainNavbar';
import CommentSection from '@/components/post/CommentSection';
import { getPostById } from '@/lib/actions/post';
import { auth } from '@/auth';
import { User } from 'next-auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PostDetailClient from './PostDetailClient';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const post = await getPostById(id);

  if (!post) notFound();

  return (
    <>
      <MainNavbar user={session?.user} />
      <div className="post-detail-page">


        {/* Post content */}
        <PostDetailClient post={post} currentUser={session?.user as (User & { id: string }) | undefined} />

        {/* Comments */}
        <CommentSection
          postId={post.id}
          comments={post.comments}
          currentUser={session?.user as (User & { id: string }) | undefined}
        />
      </div>
    </>
  );
}
