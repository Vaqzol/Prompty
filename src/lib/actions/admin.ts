'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// ── Helper: ตรวจสอบว่าเป็น Admin ──
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('ต้องเข้าสู่ระบบก่อน');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new Error('ไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
  }

  return session;
}

// ── 1. Admin Login Verification ──
export async function adminAuthenticate(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    return { error: 'ไม่พบบัญชีนี้ในระบบ' };
  }

  if (user.role !== 'ADMIN') {
    return { error: 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ' };
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  }

  return { success: true };
}

// ── 2. Dashboard: สถิติรวม ──
export async function getDashboardStats() {
  await requireAdmin();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    totalUsers,
    totalPosts,
    todayPosts,
    pendingReports,
    usersThisMonth,
    usersPrevMonth,
    postsThisMonth,
    postsPrevMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.post.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.report.count({
      where: { status: 'PENDING' },
    }),
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.post.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.post.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
  ]);

  const userGrowth =
    usersPrevMonth > 0
      ? Math.round(((usersThisMonth - usersPrevMonth) / usersPrevMonth) * 100)
      : usersThisMonth > 0
      ? 100
      : 0;

  const postGrowth =
    postsPrevMonth > 0
      ? Math.round(((postsThisMonth - postsPrevMonth) / postsPrevMonth) * 100)
      : postsThisMonth > 0
      ? 100
      : 0;

  return {
    totalUsers,
    totalPosts,
    todayPosts,
    pendingReports,
    userGrowth: userGrowth >= 0 ? `+${userGrowth}%` : `${userGrowth}%`,
    postGrowth: postGrowth >= 0 ? `+${postGrowth}%` : `${postGrowth}%`,
  };
}

// ── 3. Dashboard: กราฟสถิติโพสต์ใหม่ย้อนหลัง 30 วัน ──
export async function getDailyPostStats() {
  await requireAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const posts = await prisma.post.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
    },
  });

  // สร้าง Map 30 วันล่าสุด
  const dateMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
    dateMap.set(dateStr, 0);
  }

  // นับจำนวนโพสต์ต่อวัน
  posts.forEach((p) => {
    const d = new Date(p.createdAt);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
    if (dateMap.has(dateStr)) {
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    }
  });

  return Array.from(dateMap.entries()).map(([date, postsCount]) => ({
    date,
    postsCount,
  }));
}

// ── 4. Dashboard: กิจกรรมล่าสุด ──
export async function getRecentActivities() {
  await requireAdmin();

  const [recentPosts, recentUsers] = await Promise.all([
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: { name: true, handle: true, image: true },
        },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        handle: true,
        image: true,
        createdAt: true,
      },
    }),
  ]);

  const activities = [
    ...recentPosts.map((p) => ({
      id: `post-${p.id}`,
      type: 'POST',
      text: `@${p.author.handle || p.author.name || 'user'} สร้างโพสต์ใหม่`,
      time: p.createdAt,
      avatar: p.author.image,
    })),
    ...recentUsers.map((u) => ({
      id: `user-${u.id}`,
      type: 'USER',
      text: `@${u.handle || u.name || 'user'} สมัครสมาชิก`,
      time: u.createdAt,
      avatar: u.image,
    })),
  ];

  // เรียงลำดับเวลาจากล่าสุดไปเก่าสุด
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return activities.slice(0, 5);
}

// ── 5. Dashboard: แท็กยอดนิยม ──
export async function getPopularTags() {
  await requireAdmin();

  // ดึงแท็กที่ถูกซ่อนเพื่อกรองออก
  const hiddenTags = await prisma.tag.findMany({
    where: { status: 'HIDDEN' },
    select: { name: true },
  });
  const hiddenSet = new Set(hiddenTags.map((t) => t.name.toLowerCase()));

  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  const tagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    p.tags.forEach((tag) => {
      const clean = tag.trim().replace(/^#/, '');
      if (clean && !hiddenSet.has(clean.toLowerCase())) {
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(tagCounts)
    .map(([name, count]) => ({ name: `#${name}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return sorted;
}

// ── 6. Posts: ดึงรายการโพสต์ทั้งหมด ──
export async function getAdminPosts(options?: {
  page?: number;
  perPage?: number;
  search?: string;
  type?: 'CODE' | 'PROMPT';
  dateFrom?: string;
  dateTo?: string;
}) {
  await requireAdmin();

  const page = options?.page || 1;
  const perPage = options?.perPage || 10;
  const skip = (page - 1) * perPage;

  const where: any = {};

  if (options?.type) {
    where.type = options.type;
  }

  if (options?.search) {
    const query = options.search.trim();
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { author: { handle: { contains: query, mode: 'insensitive' } } },
      { author: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  if (options?.dateFrom || options?.dateTo) {
    where.createdAt = {};
    if (options.dateFrom) {
      where.createdAt.gte = new Date(options.dateFrom);
    }
    if (options.dateTo) {
      const endDate = new Date(options.dateTo);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, handle: true, image: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
    currentPage: page,
  };
}

// ── 7. Posts: ดึงรายละเอียดโพสต์ ──
export async function getAdminPostDetail(postId: string) {
  await requireAdmin();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      type: true,
      language: true,
      aiModel: true,
      imageUrl: true,
      tags: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          handle: true,
          image: true,
          _count: { select: { posts: true } },
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    },
  });

  return post;
}

// ── 8. Posts: ลบโพสต์ ──
export async function adminDeletePost(postId: string) {
  await requireAdmin();

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath('/admin/posts');
  revalidatePath('/admin/posts/reports');
  revalidatePath('/');
  return { success: true };
}

// ── 9. Reports: ดึงรายการโพสต์ที่ถูกรายงาน ──
export async function getAdminReports(options?: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}) {
  await requireAdmin();

  const page = options?.page || 1;
  const perPage = options?.perPage || 10;
  const skip = (page - 1) * perPage;

  const statusFilter = options?.status || 'PENDING';

  const where: any = {
    status: statusFilter,
  };

  if (options?.search) {
    const query = options.search.trim();
    where.OR = [
      { post: { title: { contains: query, mode: 'insensitive' } } },
      { post: { author: { handle: { contains: query, mode: 'insensitive' } } } },
    ];
  }

  // ดึงรายการ Report และจัดกลุ่มตาม postId
  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      postId: true,
      post: {
        select: {
          id: true,
          title: true,
          author: {
            select: { id: true, name: true, handle: true, image: true },
          },
        },
      },
    },
  });

  // Group by postId
  const groupedMap = new Map<string, {
    postId: string;
    postTitle: string;
    authorHandle: string;
    authorName: string;
    reasons: string[];
    reportCount: number;
    latestReportId: string;
  }>();

  reports.forEach((r) => {
    if (!r.post) return;
    if (!groupedMap.has(r.postId)) {
      groupedMap.set(r.postId, {
        postId: r.postId,
        postTitle: r.post.title,
        authorHandle: r.post.author.handle || r.post.author.name || 'user',
        authorName: r.post.author.name || 'user',
        reasons: [r.reason],
        reportCount: 1,
        latestReportId: r.id,
      });
    } else {
      const item = groupedMap.get(r.postId)!;
      item.reportCount += 1;
      if (!item.reasons.includes(r.reason)) {
        item.reasons.push(r.reason);
      }
    }
  });

  const groupedList = Array.from(groupedMap.values());
  const paginatedList = groupedList.slice(skip, skip + perPage);

  return {
    reports: paginatedList,
    totalCount: groupedList.length,
    totalPages: Math.ceil(groupedList.length / perPage),
    currentPage: page,
  };
}

// ── 10. Reports: ดึงรายละเอียดรายงานของโพสต์เดี่ยว ──
export async function getAdminReportDetail(postId: string) {
  await requireAdmin();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      content: true,
      description: true,
      type: true,
      language: true,
      createdAt: true,
      author: {
        select: { id: true, name: true, handle: true },
      },
      reports: {
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          user: {
            select: { name: true, handle: true },
          },
        },
      },
    },
  });

  if (!post) return null;

  const reasons = Array.from(new Set(post.reports.map((r) => r.reason)));
  const reportCount = post.reports.length;

  return {
    post,
    reasons,
    reportCount,
  };
}

// ── 11. Reports: ลบโพสต์ที่ถูกรายงาน ──
export async function adminResolveReport(postId: string) {
  await requireAdmin();

  // อัปเดตสเตตัสเป็น RESOLVED ก่อนลบ
  await prisma.report.updateMany({
    where: { postId },
    data: { status: 'RESOLVED' },
  });

  // ลบโพสต์
  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath('/admin/posts');
  revalidatePath('/admin/posts/reports');
  return { success: true };
}

// ── 12. Reports: เพิกถอนรายงาน ──
export async function adminDismissReport(postId: string) {
  await requireAdmin();

  await prisma.report.updateMany({
    where: { postId },
    data: { status: 'DISMISSED' },
  });

  revalidatePath('/admin/posts/reports');
  return { success: true };
}

// ── 13. Tags: ซิงค์แท็กจากโพสต์ที่มีอยู่เดิมเข้าสู่ตาราง Tag (Optimized Batch Insert) ──
export async function syncTagsFromPosts() {
  await requireAdmin();

  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  const uniqueTags = new Set<string>();
  posts.forEach((p) => {
    p.tags.forEach((t) => {
      const clean = t.trim().replace(/^#/, '');
      if (clean) uniqueTags.add(clean);
    });
  });

  if (uniqueTags.size > 0) {
    const tagArray = Array.from(uniqueTags).map((name) => ({
      name,
      status: 'VISIBLE',
    }));

    await prisma.tag.createMany({
      data: tagArray,
      skipDuplicates: true,
    });
  }
}

// ── 14. Tags: สถิติแท็กภาพรวม ──
export async function getTagStats() {
  await requireAdmin();
  await syncTagsFromPosts();

  const totalTags = await prisma.tag.count();

  // ดึงแท็กที่ถูกซ่อนเพื่อกรองออกจากแท็กยอดนิยม
  const hiddenTags = await prisma.tag.findMany({
    where: { status: 'HIDDEN' },
    select: { name: true },
  });
  const hiddenSet = new Set(hiddenTags.map((t) => t.name.toLowerCase()));

  // คำนวณแท็กยอดนิยมจากโพสต์
  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  const tagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    p.tags.forEach((tag) => {
      const clean = tag.trim().replace(/^#/, '');
      if (clean && !hiddenSet.has(clean.toLowerCase())) {
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      }
    });
  });

  let popularTag = 'ยังไม่มีแท็ก';
  let maxCount = 0;
  Object.entries(tagCounts).forEach(([tag, count]) => {
    if (count > maxCount) {
      maxCount = count;
      popularTag = `#${tag}`;
    }
  });

  return {
    totalTags,
    popularTag,
    popularTagCount: maxCount,
  };
}

// ── 15. Tags: ดึงรายการแท็กทั้งหมดพร้อม Pagination ตัวกรอง และการเรียงลำดับ ──
export async function getAdminTags(options?: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: 'ALL' | 'VISIBLE' | 'HIDDEN';
  sortBy?: 'MOST_POSTS' | 'FEWEST_POSTS' | 'NEWEST' | 'OLDEST' | 'NAME_ASC';
}) {
  await requireAdmin();
  await syncTagsFromPosts();

  const page = options?.page || 1;
  const perPage = options?.perPage || 10;
  const search = options?.search?.trim().replace(/^#/, '') || '';
  const statusFilter = options?.status || 'ALL';
  const sortBy = options?.sortBy || 'MOST_POSTS';

  // 1. ดึงโพสต์ทั้งหมดเพื่อนับจำนวนการใช้แท็ก
  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  const postCountsByTag: Record<string, number> = {};
  posts.forEach((p) => {
    p.tags.forEach((tag) => {
      const clean = tag.trim().replace(/^#/, '').toLowerCase();
      if (clean) {
        postCountsByTag[clean] = (postCountsByTag[clean] || 0) + 1;
      }
    });
  });

  // 2. Query Tags จาก DB ตามตัวกรอง
  const where: any = {};
  if (statusFilter !== 'ALL') {
    where.status = statusFilter;
  }
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const allTags = await prisma.tag.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // 3. แนบจำนวนโพสต์
  const formattedTags = allTags.map((tag) => ({
    id: tag.id,
    name: tag.name.startsWith('#') ? tag.name : `#${tag.name}`,
    cleanName: tag.name.replace(/^#/, ''),
    status: tag.status as 'VISIBLE' | 'HIDDEN',
    postCount: postCountsByTag[tag.name.toLowerCase()] || 0,
    createdAt: tag.createdAt,
  }));

  // 4. เรียงลำดับ (Sorting)
  if (sortBy === 'MOST_POSTS') {
    formattedTags.sort((a, b) => b.postCount - a.postCount);
  } else if (sortBy === 'FEWEST_POSTS') {
    formattedTags.sort((a, b) => a.postCount - b.postCount);
  } else if (sortBy === 'NEWEST') {
    formattedTags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'OLDEST') {
    formattedTags.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortBy === 'NAME_ASC') {
    formattedTags.sort((a, b) => a.cleanName.localeCompare(b.cleanName));
  }

  // 5. Pagination
  const totalCount = formattedTags.length;
  const totalPages = Math.ceil(totalCount / perPage);
  const skip = (page - 1) * perPage;
  const paginatedTags = formattedTags.slice(skip, skip + perPage);

  return {
    tags: paginatedTags,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

// ── 16. Tags: สร้างแท็กใหม่ ──
export async function createAdminTag(data: { name: string; status: 'VISIBLE' | 'HIDDEN' }) {
  await requireAdmin();

  const cleanName = data.name.trim().replace(/^#/, '');
  if (!cleanName) {
    return { success: false, error: 'กรุณากรอกชื่อแท็ก' };
  }

  const existing = await prisma.tag.findUnique({
    where: { name: cleanName },
  });

  if (existing) {
    return { success: false, error: 'แท็กนี้มีอยู่ในระบบแล้ว' };
  }

  const tag = await prisma.tag.create({
    data: {
      name: cleanName,
      status: data.status || 'VISIBLE',
    },
  });

  revalidatePath('/admin/tags');
  return { success: true, tag };
}

// ── 17. Tags: แก้ไขแท็ก ──
export async function updateAdminTag(
  id: string,
  data: { name?: string; status?: 'VISIBLE' | 'HIDDEN' }
) {
  await requireAdmin();

  const updateData: any = {};
  if (data.name) {
    const cleanName = data.name.trim().replace(/^#/, '');
    if (!cleanName) {
      return { success: false, error: 'กรุณากรอกชื่อแท็ก' };
    }

    // ตรวจสอบว่าชื่อใหม่ซ้ำกับแท็กอื่นหรือไม่
    const existing = await prisma.tag.findFirst({
      where: {
        name: cleanName,
        NOT: { id },
      },
    });

    if (existing) {
      return { success: false, error: 'มีแท็กชื่อนี้อยู่แล้ว' };
    }

    updateData.name = cleanName;
  }

  if (data.status) {
    updateData.status = data.status;
  }

  const updatedTag = await prisma.tag.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/tags');
  return { success: true, tag: updatedTag };
}

