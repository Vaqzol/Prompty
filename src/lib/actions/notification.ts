'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return { notifications, unreadCount };
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.notification.update({
    where: {
      id: notificationId,
      userId: session.user.id, // ensure they own it
    },
    data: { isRead: true },
  });

  revalidatePath('/');
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidatePath('/');
}

type CreateNotificationParams = {
  userId: string;
  type: 'VOTE' | 'COMMENT' | 'FOLLOW' | 'COPY_MILESTONE';
  message: string;
  actorName?: string;
  postTitle?: string;
  link?: string;
};

export async function createNotification(data: CreateNotificationParams) {
  try {
    // Check user preferences
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { notifyVotes: true, notifyComments: true, notifyFollowers: true },
    });

    if (!user) return;

    // Check if we should notify based on type and preferences
    if (data.type === 'VOTE' && !user.notifyVotes) return;
    if (data.type === 'COMMENT' && !user.notifyComments) return;
    if (data.type === 'FOLLOW' && !user.notifyFollowers) return;

    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        message: data.message,
        actorName: data.actorName,
        postTitle: data.postTitle,
        link: data.link,
      },
    });

    // Optional: revalidate path if needed, usually we don't for background creations to avoid disrupting the UI
  } catch (error) {
    console.error('Failed to create notification', error);
  }
}
