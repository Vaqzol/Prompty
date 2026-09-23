'use server';

import { prisma } from '@/lib/prisma';
import { verifiedSession as auth } from '@/lib/session';
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
