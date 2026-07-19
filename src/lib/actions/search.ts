'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// ─────────────────────────────────────────────
// 1. ค้นหาโพสต์
// ─────────────────────────────────────────────
export async function searchPosts(
  query: string,
  options?: {
    type?: 'CODE' | 'PROMPT';
    language?: string[];
    sortBy?: 'relevance' | 'latest' | 'top';
  }
) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const type = options?.type;
  const languages = options?.language?.filter(Boolean) || [];
  const sortBy = options?.sortBy || 'relevance';

  // 1. Find tags that partially match the query to use in hasSome
  const allPosts = await prisma.post.findMany({ select: { tags: true } });
  const queryLower = trimmed.toLowerCase();
  const matchingTags = Array.from(new Set(
    allPosts.flatMap(p => p.tags).filter(tag => tag.toLowerCase().includes(queryLower))
  ));

  // Build where clause
  const searchCondition = {
    OR: [
      { title: { contains: trimmed, mode: 'insensitive' as const } },
      { description: { contains: trimmed, mode: 'insensitive' as const } },
      // Exact and partial tag matches
      { tags: { hasSome: [trimmed, trimmed.toLowerCase(), ...matchingTags] } },
    ],
  };

  const where: Record<string, unknown> = { ...searchCondition };
  if (type) {
    where.type = type;
  }
  if (languages.length > 0) {
    where.language = { in: languages, mode: 'insensitive' };
  }

  // Determine ordering
  let orderBy: Record<string, string>[] | Record<string, string>;
  switch (sortBy) {
    case 'latest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'top':
      // We'll sort by vote score in memory since Prisma doesn't support computed sort
      orderBy = { createdAt: 'desc' };
      break;
    default: // relevance — prioritize exact title match, then latest
      orderBy = { createdAt: 'desc' };
      break;
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
        select: { comments: true },
      },
    },
    orderBy,
    take: 50,
  });

  // Calculate vote scores
  const results = posts.map((post) => {
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    const voteScore = upVotes - downVotes;

    return {
      ...post,
      voteScore,
      commentCount: post._count.comments,
    };
  });

  // Sort by top if requested
  if (sortBy === 'top') {
    results.sort((a, b) => b.voteScore - a.voteScore);
  }

  // For relevance, boost exact title matches
  if (sortBy === 'relevance') {
    const lowerQuery = trimmed.toLowerCase();
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aExact = aTitle.includes(lowerQuery) ? 1 : 0;
      const bExact = bTitle.includes(lowerQuery) ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      // Then by tag match
      const aTag = a.tags.some((t) => t.toLowerCase() === lowerQuery) ? 1 : 0;
      const bTag = b.tags.some((t) => t.toLowerCase() === lowerQuery) ? 1 : 0;
      if (aTag !== bTag) return bTag - aTag;
      // Then by vote score
      return b.voteScore - a.voteScore;
    });
  }

  return results;
}

// ─────────────────────────────────────────────
// 2. ค้นหาผู้ใช้
// ─────────────────────────────────────────────
export async function searchUsers(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const session = await auth();
  const currentUserId = session?.user?.id;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { handle: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      handle: true,
      image: true,
      bio: true,
      _count: {
        select: { posts: true, followers: true },
      },
      followers: currentUserId
        ? { where: { followerId: currentUserId }, select: { id: true } }
        : false,
    },
    take: 30,
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    handle: user.handle,
    image: user.image,
    bio: user.bio,
    postCount: user._count.posts,
    followerCount: user._count.followers,
    isFollowing: currentUserId ? (user.followers as { id: string }[]).length > 0 : false,
  }));
}

// ─────────────────────────────────────────────
// 3. ค้นหาแท็ก
// ─────────────────────────────────────────────
export async function searchTags(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Get all posts and extract unique tags that match
  const posts = await prisma.post.findMany({
    select: { tags: true },
  });

  // Count occurrences of each tag
  const tagCounts: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  // Filter tags that match the query
  const lowerQuery = trimmed.toLowerCase();
  const matchingTags = Object.entries(tagCounts)
    .filter(([tag]) => tag.toLowerCase().includes(lowerQuery))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return matchingTags;
}

// ─────────────────────────────────────────────
// 4. ดึงภาษาที่มีในระบบ (สำหรับ filter)
// ─────────────────────────────────────────────
export async function getAvailableLanguages() {
  const posts = await prisma.post.findMany({
    where: {
      type: 'CODE',
      language: { not: null },
    },
    select: { language: true },
    distinct: ['language'],
  });

  return posts
    .map((p) => p.language!)
    .filter(Boolean)
    .sort();
}
