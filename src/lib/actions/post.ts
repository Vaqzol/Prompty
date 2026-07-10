'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────
// Helper: ดึง session ปัจจุบัน
// ─────────────────────────────────────────────
async function getSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('กรุณาเข้าสู่ระบบก่อน');
  }
  return session as typeof session & { user: { id: string } };
}

// ─────────────────────────────────────────────
// 1. สร้างโพสต์
// ─────────────────────────────────────────────
export async function createPost(data: {
  type: 'CODE' | 'PROMPT';
  title: string;
  description?: string;
  content?: string;
  language?: string;
  aiModel?: string;
  imageUrl?: string;
  tags?: string[];
}) {
  const session = await getSession();

  if (!data.title.trim()) {
    return { success: false, error: 'กรุณาใส่ชื่อเรื่อง' };
  }

  const post = await prisma.post.create({
    data: {
      type: data.type,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      content: data.content?.trim() || null,
      language: data.language || null,
      aiModel: data.aiModel || null,
      imageUrl: data.imageUrl || null,
      tags: data.tags || [],
      authorId: session.user.id,
    },
  });

  revalidatePath('/');
  return { success: true, postId: post.id };
}

// ─────────────────────────────────────────────
// 2. ดึงโพสต์ทั้งหมด (สำหรับ Feed)
// ─────────────────────────────────────────────
export async function getPosts(filter?: 'CODE' | 'PROMPT') {
  const where = filter ? { type: filter } : {};

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true, image: true, handle: true },
      },
      votes: { select: { type: true, userId: true } },
      _count: {
        select: { comments: true, votes: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // คำนวณ vote score
  return posts.map((post) => {
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...post,
      voteScore: upVotes - downVotes,
      commentCount: post._count.comments,
    };
  });
}

// ─────────────────────────────────────────────
// 3. ดึงโพสต์เดียว (สำหรับหน้ารายละเอียด)
// ─────────────────────────────────────────────
export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true, image: true, handle: true },
      },
      votes: true,
      comments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, handle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  if (!post) return null;

  const upVotes = post.votes.filter((v) => v.type === 'UP').length;
  const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;

  return {
    ...post,
    voteScore: upVotes - downVotes,
    commentCount: post._count.comments,
  };
}

// ─────────────────────────────────────────────
// 4. แก้ไขโพสต์
// ─────────────────────────────────────────────
export async function updatePost(
  postId: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    language?: string;
    aiModel?: string;
    imageUrl?: string;
    tags?: string[];
  }
) {
  const session = await getSession();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, error: 'ไม่พบโพสต์นี้' };
  if (post.authorId !== session.user.id) {
    return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้' };
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      title: data.title?.trim(),
      description: data.description?.trim(),
      content: data.content?.trim(),
      language: data.language,
      aiModel: data.aiModel,
      imageUrl: data.imageUrl,
      tags: data.tags,
    },
  });

  revalidatePath('/');
  revalidatePath(`/post/${postId}`);
  return { success: true };
}

// ─────────────────────────────────────────────
// 5. ลบโพสต์
// ─────────────────────────────────────────────
export async function deletePost(postId: string) {
  const session = await getSession();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, error: 'ไม่พบโพสต์นี้' };
  if (post.authorId !== session.user.id) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' };
  }

  await prisma.post.delete({ where: { id: postId } });

  revalidatePath('/');
  revalidatePath('/profile');
  return { success: true };
}

// ─────────────────────────────────────────────
// 6. โหวต (Toggle)
// ─────────────────────────────────────────────
export async function toggleVote(postId: string, type: 'UP' | 'DOWN') {
  const session = await getSession();

  const existing = await prisma.vote.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });

  if (existing) {
    if (existing.type === type) {
      // ถ้ากดซ้ำ ให้ยกเลิก
      await prisma.vote.delete({ where: { id: existing.id } });
    } else {
      // ถ้าเปลี่ยนทิศ ให้อัปเดต
      await prisma.vote.update({
        where: { id: existing.id },
        data: { type },
      });
    }
  } else {
    await prisma.vote.create({
      data: { type, userId: session.user.id, postId },
    });
  }

  revalidatePath('/');
  revalidatePath(`/post/${postId}`);
  return { success: true };
}

// ─────────────────────────────────────────────
// 7. เพิ่มความคิดเห็น
// ─────────────────────────────────────────────
export async function createComment(postId: string, content: string) {
  const session = await getSession();

  if (!content.trim()) {
    return { success: false, error: 'กรุณาพิมพ์ข้อความ' };
  }

  await prisma.comment.create({
    data: {
      content: content.trim(),
      userId: session.user.id,
      postId,
    },
  });

  revalidatePath(`/post/${postId}`);
  return { success: true };
}

// ─────────────────────────────────────────────
// 8. ดึงโพสต์ของฉัน (สำหรับ Profile)
// ─────────────────────────────────────────────
export async function getMyPosts(filter?: 'CODE' | 'PROMPT') {
  const session = await getSession();

  const where: Record<string, unknown> = { authorId: session.user.id };
  if (filter) where.type = filter;

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true, image: true, handle: true },
      },
      votes: { select: { type: true, userId: true } },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return posts.map((post) => {
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...post,
      voteScore: upVotes - downVotes,
      commentCount: post._count.comments,
    };
  });
}

// ─────────────────────────────────────────────
// 9. ดึงข้อมูลโปรไฟล์ + สถิติ
// ─────────────────────────────────────────────
export async function getUserProfile() {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: { select: { posts: true } },
    },
  });

  if (!user) return null;

  // คำนวณสถิติ
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    select: {
      votes: { select: { type: true } },
      _count: { select: { comments: true } },
    },
  });

  let totalVoteScore = 0;
  let totalCopies = 0;
  posts.forEach((post) => {
    const up = post.votes.filter((v) => v.type === 'UP').length;
    const down = post.votes.filter((v) => v.type === 'DOWN').length;
    totalVoteScore += up - down;
    // copies จะเก็บในอนาคต ตอนนี้ใช้ comment count แทน
    totalCopies += post._count.comments;
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    bio: user.bio,
    handle: user.handle || user.email?.split('@')[0] || null,
    postCount: user._count.posts,
    totalVoteScore,
    totalCopies,
    totalPoints: totalVoteScore + totalCopies,
  };
}
