'use server';

import { requireSession } from '@/lib/session';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import { validPassword } from '@/lib/security-tokens';
import { rateLimit } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';

const getSession = requireSession;

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
  await rateLimit('password-change', session.user.id, 5, 900);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: 'บัญชีนี้ใช้ Social Login ไม่สามารถเปลี่ยนรหัสผ่านได้' };
  }

  if (typeof oldPassword !== 'string' || Buffer.byteLength(oldPassword, 'utf8') > 72) return {success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง'};
  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' };
  }

  if (!validPassword(newPassword)) {
    return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์' };
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

  const allowed = ['notifyComments','notifyVotes','notifyFollowers','notifyDigest','notifySecurity','theme','codeTheme'];
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(k => !allowed.includes(k))) throw new Error('ข้อมูลการตั้งค่าไม่ถูกต้อง');
  const clean: typeof data = {};
  for (const key of ['notifyComments','notifyVotes','notifyFollowers','notifyDigest','notifySecurity'] as const) {
    if (data[key] !== undefined) { if (typeof data[key] !== 'boolean') throw new Error('ข้อมูลการตั้งค่าไม่ถูกต้อง'); clean[key] = data[key]; }
  }
  if (data.theme !== undefined) {
    if (!['light','dark','system'].includes(data.theme)) throw new Error('ธีมไม่ถูกต้อง');
    clean.theme = data.theme;
  }
  if (data.codeTheme !== undefined) {
    if (!['vs-code-dark-modern','VS Code Dark Modern','GitHub Dark','Monokai','One Dark Pro','Night Owl'].includes(data.codeTheme)) throw new Error('ธีมโค้ดไม่ถูกต้อง');
    clean.codeTheme = data.codeTheme;
  }
  await prisma.user.update({where: {id: session.user.id}, data: clean});

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
