'use server';

import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/lib/constants/categories';

// Helper to filter date by period
function getDateFromPeriod(period: 'week' | 'month' | 'all') {
  if (period === 'all') return undefined;
  const now = new Date();
  if (period === 'week') {
    now.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    now.setDate(now.getDate() - 30);
  }
  return now;
}

// ─────────────────────────────────────────────
// 1. Trending Posts
// ─────────────────────────────────────────────
export async function getTrendingPosts(
  period: 'week' | 'month' | 'all' = 'week',
  type?: 'CODE' | 'PROMPT'
) {
  const dateFrom = getDateFromPeriod(period);

  const where: Record<string, unknown> = {};
  if (dateFrom) {
    where.createdAt = { gte: dateFrom };
  }
  if (type) {
    where.type = type;
  }

  const posts = await prisma.post.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      language: true,
      aiModel: true,
      tags: true,
      createdAt: true,
      content: true,
      imageUrl: true,
      copyCount: true,
      author: {
        select: { id: true, name: true, email: true, image: true, handle: true },
      },
      votes: { select: { type: true, userId: true } },
      bookmarks: { select: { userId: true } },
      _count: {
        select: { comments: true, votes: true },
      },
    },
  });

  const formatted = posts.map((post) => {
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...post,
      voteScore: upVotes - downVotes,
      commentCount: post._count.comments,
    };
  });

  // Order by voteScore descending
  formatted.sort((a, b) => b.voteScore - a.voteScore);

  return formatted;
}

// ─────────────────────────────────────────────
// 2. Top Contributors Leaderboard
// ─────────────────────────────────────────────
export async function getTopContributors(
  limit: number = 5,
  period: 'week' | 'month' | 'all' = 'week'
) {
  const dateFrom = getDateFromPeriod(period);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      handle: true,
      email: true,
      posts: {
        where: dateFrom ? { createdAt: { gte: dateFrom } } : {},
        select: {
          copyCount: true,
          votes: { select: { type: true } },
        },
      },
    },
  });

  const scored = users.map((user) => {
    let totalScore = 0;
    user.posts.forEach((p) => {
      const up = p.votes.filter((v) => v.type === 'UP').length;
      const down = p.votes.filter((v) => v.type === 'DOWN').length;
      totalScore += up - down + (p.copyCount || 0);
    });

    return {
      id: user.id,
      name: user.name || 'ผู้ใช้งาน',
      image: user.image,
      handle: user.handle || user.email?.split('@')[0] || 'user',
      totalScore,
    };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored.slice(0, limit);
}

// ─────────────────────────────────────────────
// 2b. Full Leaderboard Page Data
// ─────────────────────────────────────────────
export async function getLeaderboard(
  period: 'week' | 'month' | 'all' = 'week',
  limit: number = 20
) {
  const dateFrom = getDateFromPeriod(period);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      handle: true,
      email: true,
      posts: {
        where: dateFrom ? { createdAt: { gte: dateFrom } } : {},
        select: {
          copyCount: true,
          votes: { select: { type: true } },
        },
      },
    },
  });

  const scored = users.map((user) => {
    let copyCount = 0;
    let voteScore = 0;

    user.posts.forEach((p) => {
      copyCount += p.copyCount || 0;
      const up = p.votes.filter((v) => v.type === 'UP').length;
      const down = p.votes.filter((v) => v.type === 'DOWN').length;
      voteScore += up - down;
    });

    const totalScore = copyCount + voteScore;

    return {
      id: user.id,
      name: user.name || 'ผู้ใช้งาน',
      image: user.image,
      handle: user.handle || user.email?.split('@')[0] || 'user',
      copyCount,
      voteScore,
      totalScore,
    };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);

  return scored.slice(0, limit).map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
}

export async function getCurrentUserRank(
  userId: string,
  period: 'week' | 'month' | 'all' = 'week'
) {
  const dateFrom = getDateFromPeriod(period);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      handle: true,
      email: true,
      posts: {
        where: dateFrom ? { createdAt: { gte: dateFrom } } : {},
        select: {
          copyCount: true,
          votes: { select: { type: true } },
        },
      },
    },
  });

  const scored = users.map((user) => {
    let copyCount = 0;
    let voteScore = 0;

    user.posts.forEach((p) => {
      copyCount += p.copyCount || 0;
      const up = p.votes.filter((v) => v.type === 'UP').length;
      const down = p.votes.filter((v) => v.type === 'DOWN').length;
      voteScore += up - down;
    });

    return {
      id: user.id,
      name: user.name || 'ผู้ใช้งาน',
      image: user.image,
      handle: user.handle || user.email?.split('@')[0] || 'user',
      copyCount,
      voteScore,
      totalScore: copyCount + voteScore,
    };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);

  const userIndex = scored.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;

  return {
    ...scored[userIndex],
    rank: userIndex + 1,
  };
}

// ─────────────────────────────────────────────
// 3. All Tags with Post Count
// ─────────────────────────────────────────────
export async function getAllTags() {
  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  const tagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    p.tags.forEach((t) => {
      if (t) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    });
  });

  const result = Object.entries(tagCounts).map(([name, count]) => ({
    name,
    count,
  }));

  result.sort((a, b) => b.count - a.count);
  return result;
}

// ─────────────────────────────────────────────
// 4. Posts by Tag
// ─────────────────────────────────────────────
export async function getPostsByTag(
  tag: string,
  period: 'week' | 'month' | 'all' = 'week'
) {
  const dateFrom = getDateFromPeriod(period);
  const decoded = decodeURIComponent(tag).trim();

  // Find posts with matching tags (case-insensitive)
  const allPosts = await prisma.post.findMany({
    where: dateFrom ? { createdAt: { gte: dateFrom } } : {},
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      language: true,
      aiModel: true,
      tags: true,
      createdAt: true,
      content: true,
      imageUrl: true,
      copyCount: true,
      author: {
        select: { id: true, name: true, email: true, image: true, handle: true },
      },
      votes: { select: { type: true, userId: true } },
      bookmarks: { select: { userId: true } },
      _count: {
        select: { comments: true },
      },
    },
  });

  const tagLower = decoded.toLowerCase();
  const filtered = allPosts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tagLower)
  );

  const formatted = filtered.map((post) => {
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...post,
      voteScore: upVotes - downVotes,
      commentCount: post._count.comments,
    };
  });

  formatted.sort((a, b) => b.voteScore - a.voteScore);
  return formatted;
}

// ─────────────────────────────────────────────
// 5. All Categories
// ─────────────────────────────────────────────
export async function getAllCategories() {
  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  return CATEGORIES.map((cat) => {
    const catTagsLower = cat.tags.map((t) => t.toLowerCase());
    const count = posts.filter((p) =>
      p.tags.some((t) => catTagsLower.includes(t.toLowerCase()))
    ).length;

    return {
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      postCount: count,
    };
  });
}

// ─────────────────────────────────────────────
// 6. Posts by Category
// ─────────────────────────────────────────────
export async function getCategoryPosts(
  slug: string,
  period: 'week' | 'month' | 'all' = 'week'
) {
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return null;

  const dateFrom = getDateFromPeriod(period);
  const catTagsLower = category.tags.map((t) => t.toLowerCase());

  const allPosts = await prisma.post.findMany({
    where: dateFrom ? { createdAt: { gte: dateFrom } } : {},
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      language: true,
      aiModel: true,
      tags: true,
      createdAt: true,
      content: true,
      imageUrl: true,
      copyCount: true,
      author: {
        select: { id: true, name: true, email: true, image: true, handle: true },
      },
      votes: { select: { type: true, userId: true } },
      bookmarks: { select: { userId: true } },
      _count: {
        select: { comments: true },
      },
    },
  });

  const filtered = allPosts.filter((post) =>
    post.tags.some((t) => catTagsLower.includes(t.toLowerCase()))
  );

  const formatted = filtered.map((post) => {
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...post,
      voteScore: upVotes - downVotes,
      commentCount: post._count.comments,
    };
  });

  formatted.sort((a, b) => b.voteScore - a.voteScore);
  return {
    category,
    posts: formatted,
  };
}
