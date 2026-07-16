'use server';

import { auth } from '@/auth';
import { prisma } from '../prisma';

export async function toggleBookmark(postId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'ต้องเข้าสู่ระบบก่อนบันทึกโพสต์' };
    }

    const userId = session.user.id;

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      return { success: true, bookmarked: false };
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          postId,
        },
      });
      return { success: true, bookmarked: true };
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกโพสต์' };
  }
}

// ─────────────────────────────────────────────
// ดึงโพสต์ที่บันทึกไว้
// ─────────────────────────────────────────────
export async function getSavedPosts(filter?: 'CODE' | 'PROMPT') {
  const session = await auth();
  if (!session?.user?.id) return [];

  const where: Record<string, unknown> = { userId: session.user.id };
  if (filter) {
    where.post = { type: filter };
  }

  const bookmarks = await prisma.bookmark.findMany({
    where,
    include: {
      post: {
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true, handle: true },
          },
          votes: { select: { type: true, userId: true } },
          bookmarks: { select: { userId: true } },
          _count: { select: { comments: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookmarks.map((bm) => {
    const post = bm.post;
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...post,
      voteScore: upVotes - downVotes,
      commentCount: post._count.comments,
    };
  });
}
