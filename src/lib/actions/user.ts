'use server';

import { auth } from '@/auth';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('กรุณาเข้าสู่ระบบก่อน');
  }
  return session as typeof session & { user: { id: string } };
}

// ─────────────────────────────────────────────
// อัปเดตโปรไฟล์
// ─────────────────────────────────────────────
export async function updateProfile(data: {
  name?: string;
  handle?: string;
  bio?: string;
  githubUrl?: string;
  twitterUrl?: string;
  image?: string;
}) {
  const session = await getSession();
  const userId = session.user.id;

  // เช็ค handle ซ้ำ
  if (data.handle) {
    const handleTrimmed = data.handle.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { handle: handleTrimmed },
    });
    if (existing && existing.id !== userId) {
      return { success: false, error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น' };
    }
    data.handle = handleTrimmed;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name?.trim() || undefined,
      handle: data.handle || undefined,
      bio: data.bio?.trim() ?? undefined,
      githubUrl: data.githubUrl?.trim() || null,
      twitterUrl: data.twitterUrl?.trim() || null,
      image: data.image || undefined,
    },
  });

  revalidatePath('/settings/profile');
  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true };
}

// ─────────────────────────────────────────────
// เปลี่ยนรหัสผ่าน
// ─────────────────────────────────────────────
export async function changePassword(oldPassword: string, newPassword: string) {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: 'บัญชีนี้ใช้ Social Login ไม่สามารถเปลี่ยนรหัสผ่านได้' };
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// ลบบัญชี
// ─────────────────────────────────────────────
export async function deleteAccount() {
  const session = await getSession();

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// อัปเดตการตั้งค่า (แจ้งเตือน / ธีม)
// ─────────────────────────────────────────────
export async function updatePreferences(data: {
  notifyComments?: boolean;
  notifyVotes?: boolean;
  notifyFollowers?: boolean;
  notifyDigest?: boolean;
  notifySecurity?: boolean;
  theme?: string;
  codeTheme?: string;
}) {
  const session = await getSession();

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  revalidatePath('/settings/notifications');
  revalidatePath('/settings/appearance');
  return { success: true };
}

// ─────────────────────────────────────────────
// ดึงข้อมูลการตั้งค่าผู้ใช้
// ─────────────────────────────────────────────
export async function getUserSettings() {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      handle: true,
      email: true,
      image: true,
      bio: true,
      githubUrl: true,
      twitterUrl: true,
      passwordHash: true,
      notifyComments: true,
      notifyVotes: true,
      notifyFollowers: true,
      notifyDigest: true,
      notifySecurity: true,
      theme: true,
      codeTheme: true,
      accounts: { select: { provider: true } },
    },
  });

  if (!user) return null;

  return {
    ...user,
    hasPassword: !!user.passwordHash,
    isOAuth: user.accounts.length > 0,
    passwordHash: undefined,
    accounts: undefined,
  };
}
