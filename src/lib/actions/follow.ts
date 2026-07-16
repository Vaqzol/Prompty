'use server';

import { auth } from '@/auth';
import { prisma } from '../prisma';
import { createNotification } from './notification';

export async function toggleFollow(followingId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };
    }

    const followerId = session.user.id;

    if (followerId === followingId) {
      return { success: false, error: 'คุณไม่สามารถติดตามตัวเองได้' };
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return { success: true, isFollowing: false };
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // ดึงชื่อคนกดติดตามเพื่อส่งแจ้งเตือน
      const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { name: true } });

      await createNotification({
        type: 'FOLLOW',
        message: `${follower?.name || 'มีคน'} เริ่มติดตามคุณ`,
        link: `/profile/${followerId}`, // ถ้ามีหน้า profile สาธารณะ
        userId: followingId,
        actorName: follower?.name || 'ผู้ใช้งาน',
      });

      return { success: true, isFollowing: true };
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการติดตาม' };
  }
}
