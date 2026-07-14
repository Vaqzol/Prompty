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
