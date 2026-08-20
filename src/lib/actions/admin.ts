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

// ── 3. Dashboard: กราฟสถิติโพสต์ใหม่ย้อนหลัง ──
export async function getDailyPostStats(days: number = 30) {
  await requireAdmin();

  const numDays = Math.max(1, Math.min(days, 180));
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - (numDays - 1));
  startDate.setHours(0, 0, 0, 0);

  const posts = await prisma.post.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
  });

  // สร้าง Map สำหรับช่วงวันที่เลือก
  const dateMap = new Map<string, number>();
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
    dateMap.set(dateStr, 0);
  }

  // นับจำนวนโพสต์ต่อวัน
  posts.forEach((p: { createdAt: Date }) => {
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
    ...recentPosts.map((p: {
      id: string;
      title: string | null;
      createdAt: Date;
      author: { name: string | null; handle: string | null; image: string | null };
    }) => ({
      id: `post-${p.id}`,
      type: 'POST',
      text: `@${p.author.handle || p.author.name || 'user'} สร้างโพสต์ใหม่`,
      time: p.createdAt,
      avatar: p.author.image,
    })),
    ...recentUsers.map((u: {
      id: string;
      name: string | null;
      handle: string | null;
      image: string | null;
      createdAt: Date;
    }) => ({
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
  posts.forEach((p: { tags: string[] }) => {
    p.tags.forEach((tag: string) => {
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
      { postTitle: { contains: query, mode: 'insensitive' } },
      { authorHandle: { contains: query, mode: 'insensitive' } },
    ];
  }

  // ดึงรายการ Report และจัดกลุ่มตาม postId หรือ id
  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      postId: true,
      postTitle: true,
      authorHandle: true,
      authorName: true,
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

  // Group by postId หรือ id ของ report
  const groupedMap = new Map<string, {
    postId: string;
    postTitle: string;
    authorHandle: string;
    authorName: string;
    reasons: string[];
    reportCount: number;
    latestReportId: string;
    isDeleted: boolean;
  }>();

  reports.forEach((r) => {
    const groupKey = r.postId || `resolved-${r.id}`;
    const pTitle = r.post?.title || r.postTitle || '[โพสต์ถูกลบแล้ว]';
    const aHandle = r.post?.author.handle || r.post?.author.name || r.authorHandle || r.authorName || 'user';
    const aName = r.post?.author.name || r.authorName || 'user';

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        postId: r.postId || '',
        postTitle: pTitle,
        authorHandle: aHandle,
        authorName: aName,
        reasons: [r.reason],
        reportCount: 1,
        latestReportId: r.id,
        isDeleted: !r.post,
      });
    } else {
      const item = groupedMap.get(groupKey)!;
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

  if (!postId) return null;

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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });

  if (post) {
    // บันทึกประวัติ Snapshot ลงใน Report ก่อนลบโพสต์
    await prisma.report.updateMany({
      where: { postId },
      data: {
        status: 'RESOLVED',
        postTitle: post.title,
        authorHandle: post.author.handle || post.author.name || 'user',
        authorName: post.author.name || 'user',
      },
    });

    // ลบโพสต์
    await prisma.post.delete({
      where: { id: postId },
    });
  }

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
  posts.forEach((p: { tags: string[] }) => {
    p.tags.forEach((t: string) => {
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
  posts.forEach((p: { tags: string[] }) => {
    p.tags.forEach((tag: string) => {
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
  posts.forEach((p: { tags: string[] }) => {
    p.tags.forEach((tag: string) => {
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

// ─────────────────────────────────────────────
// 17. Users: สถิติผู้ใช้งานภาพรวม
// ─────────────────────────────────────────────
export async function getUserStats() {
  await requireAdmin();

  const now = new Date();

  // วันเริ่มต้นสัปดาห์นี้ (วันจันทร์ 00:00:00)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [totalUsers, usersThisMonth, usersPrevMonth, newThisWeek, bannedCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { status: 'BANNED' } }),
    ]);

  const userGrowthNum =
    usersPrevMonth > 0
      ? Math.round(((usersThisMonth - usersPrevMonth) / usersPrevMonth) * 100)
      : usersThisMonth > 0
      ? 100
      : 0;

  const userGrowth = userGrowthNum >= 0 ? `+${userGrowthNum}%` : `${userGrowthNum}%`;

  return {
    totalUsers,
    userGrowth,
    newThisWeek,
    bannedCount,
  };
}

// ─────────────────────────────────────────────
// 18. Users: ดึงรายการผู้ใช้พร้อม ตัวกรอง ค้นหา และ Pagination
// ─────────────────────────────────────────────
export async function getAdminUsers(options?: {
  page?: number;
  perPage?: number;
  search?: string;
  roleFilter?: 'ALL' | 'ADMIN' | 'USER';
  statusFilter?: 'ALL' | 'ACTIVE' | 'BANNED';
}) {
  await requireAdmin();

  const page = options?.page || 1;
  const perPage = options?.perPage || 10;
  const skip = (page - 1) * perPage;

  const where: any = {};

  if (options?.roleFilter && options.roleFilter !== 'ALL') {
    where.role = options.roleFilter;
  }

  if (options?.statusFilter && options.statusFilter !== 'ALL') {
    where.status = options.statusFilter;
  }

  if (options?.search) {
    const q = options.search.trim().toLowerCase();
    const cleanSearch = q.replace(/^@/, '');
    where.OR = [
      { name: { contains: cleanSearch, mode: 'insensitive' } },
      { handle: { contains: cleanSearch, mode: 'insensitive' } },
      { email: { contains: cleanSearch, mode: 'insensitive' } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        handle: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { posts: true, comments: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return {
    users,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

// ─────────────────────────────────────────────
// 19. Users: อัปเดต สิทธิ์ (Role) และ สถานะ (Status)
// ─────────────────────────────────────────────
export async function updateUserRoleAndStatus(
  userId: string,
  data: {
    role?: 'ADMIN' | 'USER';
    status?: 'ACTIVE' | 'BANNED';
  }
) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };
  }

  if (userId === session.user.id && data.role === 'USER') {
    return { success: false, error: 'คุณไม่สามารถปลดสิทธิ์ Admin ของตัวเองได้' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.role && { role: data.role }),
      ...(data.status && { status: data.status }),
    },
  });

  revalidatePath('/admin/users');
  return { success: true, user: updated };
}

// ─────────────────────────────────────────────
// 20. Users: สร้างบัญชี ผู้ดูแลระบบ (Admin) ใหม่
// ─────────────────────────────────────────────
export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  await requireAdmin();

  const cleanName = data.name.trim();
  const cleanEmail = data.email.trim().toLowerCase();

  if (!cleanName || !cleanEmail || !data.password) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' };
  }

  if (data.password.length < 6) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' };
  }

  // สร้าง handle จากชื่อ
  let baseHandle = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!baseHandle) baseHandle = 'admin';

  let handle = baseHandle;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { handle } })) {
    handle = `${baseHandle}_${counter}`;
    counter++;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const newAdmin = await prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      handle,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  revalidatePath('/admin/users');
  return { success: true, user: newAdmin };
}

// ─────────────────────────────────────────────
// 21. Users: ลบบัญชีผู้ใช้งานออกจากระบบ
// ─────────────────────────────────────────────
export async function deleteUserAccount(userId: string) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };
  }

  if (userId === session.user.id) {
    return { success: false, error: 'คุณไม่สามารถลบบัญชีตัวเองได้' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
  }

  // ใช้ Transaction ลบข้อมูลลูกทั้งหมดตามลำดับ
  await prisma.$transaction(async (tx) => {
    // 1. ลบ Notification, Bookmark, Collection, Vote, Report ที่สร้างโดย User
    await tx.notification.deleteMany({ where: { userId } });
    await tx.bookmark.deleteMany({ where: { userId } });
    await tx.bookmarkCollection.deleteMany({ where: { userId } });
    await tx.vote.deleteMany({ where: { userId } });
    await tx.report.deleteMany({ where: { userId } });
    await tx.follow.deleteMany({
      where: { OR: [{ followerId: userId }, { followingId: userId }] },
    });

    // 2. ลบ Comment
    await tx.comment.deleteMany({ where: { userId } });

    // ลบโพสต์ของผู้ใช้ (ใช้ authorId) (รวมถึง Reports, Comments, Votes ที่ติดกับโพสต์นั้น)
    const userPosts = await tx.post.findMany({
      where: { authorId: userId },
      select: { id: true },
    });
    const postIds = userPosts.map((p) => p.id);

    if (postIds.length > 0) {
      await tx.report.deleteMany({ where: { postId: { in: postIds } } });
      await tx.vote.deleteMany({ where: { postId: { in: postIds } } });
      await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
      await tx.bookmark.deleteMany({ where: { postId: { in: postIds } } });
      await tx.post.deleteMany({ where: { authorId: userId } });
    }

    // 3. ลบ Account & Session
    await tx.account.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });

    // 4. ลบ User
    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath('/admin/users');
  return { success: true };
}

// ─────────────────────────────────────────────
// 22. Settings: ดึงข้อมูลโปรไฟล์ Admin ที่ล็อกอินอยู่
// ─────────────────────────────────────────────
export async function getAdminProfile() {
  const session = await requireAdmin();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      handle: true,
      role: true,
      image: true,
    },
  });

  return user;
}

// ─────────────────────────────────────────────
// 23. Settings: เปลี่ยนรหัสผ่าน Admin
// ─────────────────────────────────────────────
export async function updateAdminPassword(data: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };
  }

  if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
    return { success: false, error: 'กรุณากรอกข้อมูลรหัสผ่านให้ครบทุกช่อง' };
  }

  if (data.newPassword !== data.confirmPassword) {
    return { success: false, error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' };
  }

  if (data.newPassword.length < 6) {
    return { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.passwordHash) {
    return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
  }

  const isValidCurrent = await bcrypt.compare(
    data.currentPassword,
    user.passwordHash
  );

  if (!isValidCurrent) {
    return { success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' };
  }

  const newPasswordHash = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newPasswordHash },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// 24. Settings: เปลี่ยนอีเมล Admin
// ─────────────────────────────────────────────
export async function updateAdminEmail(newEmail: string) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };
  }

  const cleanEmail = newEmail.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'กรุณากรอกอีเมล' };
  }

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing && existing.id !== session.user.id) {
    return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: cleanEmail },
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

// ─────────────────────────────────────────────
// 25. Settings: ดึงข้อมูลการตั้งค่าระบบ
// ─────────────────────────────────────────────
export async function getSystemSettings() {
  await requireAdmin();

  try {
    const settings = await (prisma as any).systemSetting.findMany();
    const map = new Map(settings.map((s: any) => [s.key, s.value]));

    return {
      maintenanceMode: map.get('maintenance_mode') === 'true',
      autoHideReports: map.get('auto_hide_reports') !== 'false', // Default true
    };
  } catch (err) {
    console.error('getSystemSettings error:', err);
    return {
      maintenanceMode: false,
      autoHideReports: true,
    };
  }
}

// ─────────────────────────────────────────────
// 26. Settings: อัปเดตการตั้งค่าระบบ
// ─────────────────────────────────────────────
export async function updateSystemSetting(key: string, value: boolean) {
  await requireAdmin();

  try {
    await (prisma as any).systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  } catch (err) {
    console.error('updateSystemSetting error:', err);
  }

  revalidatePath('/admin/settings');
  return { success: true };
}



