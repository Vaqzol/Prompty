'use server';

import { prisma } from '../prisma';
import { createNotification } from './notification';

export async function trackCopy(postId: string) {
  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { copyCount: { increment: 1 } },
      select: { copyCount: true, authorId: true, title: true },
    });

    // Check milestones
    const MILESTONES = [10, 50, 100, 1000];
    if (MILESTONES.includes(post.copyCount)) {
      await createNotification({
        type: 'COPY_MILESTONE',
        message: `ยินดีด้วย! โพสต์ของคุณถูกนำไปคัดลอกใช้งานถึง ${post.copyCount} ครั้งแล้ว 🎉`,
        link: `/post/${postId}`,
        userId: post.authorId,
        postTitle: post.title,
      });
    }

    return { success: true, count: post.copyCount };
  } catch (error) {
    console.error('Error tracking copy:', error);
    return { success: false };
  }
}
