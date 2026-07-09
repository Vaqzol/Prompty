import { getPostById } from '@/lib/actions/post';
import { auth } from '@/auth';
import { User } from 'next-auth';
import { notFound } from 'next/navigation';
import PostDetailClient from '@/app/post/[id]/PostDetailClient';
import CommentSection from '@/components/post/CommentSection';
import PostDetailModal from '@/components/post/PostDetailModal';

export default async function InterceptedPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const post = await getPostById(id);

  if (!post) notFound();

  return (
    <PostDetailModal>
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
    </PostDetailModal>
  );
}
