'use server';

import { auth } from '@/auth';
import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';

export async function toggleBookmark(postId: string, collectionId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'ต้องเข้าสู่ระบบก่อนบันทึกโพสต์' };
    }

    const userId = session.user.id;

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      revalidatePath('/bookmarks');
      revalidatePath('/profile');
      return { success: true, bookmarked: false };
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          postId,
          collectionId: collectionId || null,
        },
      });
      revalidatePath('/bookmarks');
      revalidatePath('/profile');
      return { success: true, bookmarked: true };
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกโพสต์' };
  }
}

// ─────────────────────────────────────────────
// ดึงโพสต์ที่บันทึกไว้
// ─────────────────────────────────────────────
export async function getSavedPosts(collectionId?: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const where: Record<string, unknown> = { userId: session.user.id };
  if (collectionId) {
    where.collectionId = collectionId;
  }

  const bookmarks = await prisma.bookmark.findMany({
    where,
    include: {
      post: {
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true, handle: true },
          },
          votes: { select: { type: true, userId: true } },
          bookmarks: { select: { userId: true } },
          _count: { select: { comments: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookmarks.map((bm) => {
    const post = bm.post;
    const upVotes = post.votes.filter((v) => v.type === 'UP').length;
    const downVotes = post.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...post,
      bookmarkId: bm.id,
      collectionId: bm.collectionId,
      voteScore: upVotes - downVotes,
      commentCount: post._count.comments,
    };
  });
}

// ─────────────────────────────────────────────
// Collection CRUD
// ─────────────────────────────────────────────
export async function getCollections() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const collections = await prisma.bookmarkCollection.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { bookmarks: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    isPublic: c.isPublic,
    count: c._count.bookmarks,
    createdAt: c.createdAt,
  }));
}

export async function createCollection(name: string, isPublic: boolean = false, description?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };

    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'กรุณาระบุชื่อคอลเลกชัน' };
    if (trimmed.length > 50) return { success: false, error: 'ชื่อยาวเกินไป (สูงสุด 50 ตัวอักษร)' };

    const collection = await prisma.bookmarkCollection.create({
      data: {
        name: trimmed,
        isPublic,
        description: description?.trim() || null,
        userId: session.user.id,
      },
    });

    revalidatePath('/bookmarks');
    revalidatePath('/profile');
    revalidatePath('/collections');
    return {
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description || '',
        isPublic: collection.isPublic,
        count: 0,
      },
    };
  } catch (error) {
    // Unique constraint error
    if ((error as { code?: string }).code === 'P2002') {
      return { success: false, error: 'ชื่อคอลเลกชันนี้มีอยู่แล้ว' };
    }
    console.error('Error creating collection:', error);
    return { success: false, error: 'เกิดข้อผิดพลาด' };
  }
}

export async function updateCollection(
  collectionId: string,
  data: { name?: string; isPublic?: boolean; description?: string }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };

    const updateData: { name?: string; isPublic?: boolean; description?: string | null } = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) return { success: false, error: 'กรุณาระบุชื่อคอลเลกชัน' };
      updateData.name = trimmed;
    }
    if (data.isPublic !== undefined) {
      updateData.isPublic = data.isPublic;
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }

    await prisma.bookmarkCollection.update({
      where: { id: collectionId, userId: session.user.id },
      data: updateData,
    });

    revalidatePath('/bookmarks');
    revalidatePath('/profile');
    revalidatePath('/collections');
    return { success: true };
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return { success: false, error: 'ชื่อคอลเลกชันนี้มีอยู่แล้ว' };
    }
    console.error('Error updating collection:', error);
    return { success: false, error: 'เกิดข้อผิดพลาด' };
  }
}

export async function renameCollection(collectionId: string, name: string) {
  return updateCollection(collectionId, { name });
}

export async function deleteCollection(collectionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };

    // SetNull on bookmarks is handled by Prisma relation
    await prisma.bookmarkCollection.delete({
      where: { id: collectionId, userId: session.user.id },
    });

    revalidatePath('/bookmarks');
    revalidatePath('/profile');
    revalidatePath('/collections');
    return { success: true };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { success: false, error: 'เกิดข้อผิดพลาด' };
  }
}

export async function moveToCollection(bookmarkId: string, collectionId: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'ต้องเข้าสู่ระบบก่อน' };

    await prisma.bookmark.update({
      where: { id: bookmarkId, userId: session.user.id },
      data: { collectionId },
    });

    revalidatePath('/bookmarks');
    revalidatePath('/profile');
    revalidatePath('/collections');
    return { success: true };
  } catch (error) {
    console.error('Error moving bookmark:', error);
    return { success: false, error: 'เกิดข้อผิดพลาด' };
  }
}

// ─────────────────────────────────────────────
// Public Collections API for Profile & Sharing
// ─────────────────────────────────────────────
export async function getPublicCollectionsByUser(userId: string) {
  const collections = await prisma.bookmarkCollection.findMany({
    where: { userId, isPublic: true },
    include: {
      _count: { select: { bookmarks: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    isPublic: c.isPublic,
    count: c._count.bookmarks,
    createdAt: c.createdAt,
  }));
}

export async function getPublicCollectionDetail(collectionId: string) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const collection = await prisma.bookmarkCollection.findUnique({
    where: { id: collectionId },
    include: {
      user: {
        select: { id: true, name: true, image: true, handle: true, email: true },
      },
      bookmarks: {
        include: {
          post: {
            include: {
              author: {
                select: { id: true, name: true, image: true, handle: true, email: true },
              },
              votes: { select: { type: true, userId: true } },
              bookmarks: { select: { userId: true } },
              _count: { select: { comments: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!collection) return null;

  // If private and not owner -> cannot view
  if (!collection.isPublic && collection.userId !== currentUserId) {
    return null;
  }

  const formattedPosts = collection.bookmarks.map((bm) => {
    const p = bm.post;
    const upVotes = p.votes.filter((v) => v.type === 'UP').length;
    const downVotes = p.votes.filter((v) => v.type === 'DOWN').length;
    return {
      ...p,
      bookmarkId: bm.id,
      collectionId: bm.collectionId,
      voteScore: upVotes - downVotes,
      commentCount: p._count.comments,
    };
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description || '',
    isPublic: collection.isPublic,
    createdAt: collection.createdAt,
    owner: collection.user,
    posts: formattedPosts,
    isOwner: collection.userId === currentUserId,
  };
}
