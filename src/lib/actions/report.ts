'use server';

import { auth } from '@/auth';
import { prisma } from '../prisma';

export async function createReport(postId: string, reason: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'ต้องเข้าสู่ระบบก่อนรายงาน' };
    }

    const userId = session.user.id;

    // Check if user already reported this post
    const existingReport = await prisma.report.findFirst({
      where: {
        userId,
        postId,
      },
    });

    if (existingReport) {
      return { success: false, error: 'คุณได้รายงานโพสต์นี้ไปแล้ว' };
    }

    await prisma.report.create({
      data: {
        reason,
        userId,
        postId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating report:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการรายงาน' };
  }
}
