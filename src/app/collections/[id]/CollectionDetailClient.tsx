'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Folder,
  Globe,
  Lock,
  Share2,
  Check,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Sparkles,
  Code2,
  Flag,
} from 'lucide-react';
import { toggleVote } from '@/lib/actions/post';
import BookmarkButton from '@/components/shared/BookmarkButton';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import CodeCopyBlock from '@/components/shared/CodeCopyBlock';
import PromptCopyBlock from '@/components/shared/PromptCopyBlock';
import ReportModal from '@/components/feed/ReportModal';
import ShareModal from '@/components/feed/ShareModal';

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม. ที่แล้ว`;
  return `${Math.floor(diff / 86400)} วัน ที่แล้ว`;
}

interface PostData {
  id: string;
  type: string;
  title: string;
  description: string | null;
  content: string | null;
  language: string | null;
  aiModel: string | null;
  imageUrl: string | null;
  tags: string[];
  voteScore: number;
  commentCount: number;
  copyCount?: number;
  createdAt: Date | string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    handle: string | null;
  };
  votes: { userId: string; type: string }[];
  bookmarks: { userId: string }[];
}

interface CollectionData {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: Date | string;
  isOwner: boolean;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
    handle: string | null;
    email: string | null;
  };
  posts: PostData[];
}

function CollectionPostCard({
  post,
  currentUserId,
}: {
  post: PostData;
  currentUserId?: string;
}) {
  const [voteScore, setVoteScore] = useState(post.voteScore);
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(() => {
    if (!currentUserId) return null;
    const v = post.votes.find((vote) => vote.userId === currentUserId);
    return (v?.type as 'UP' | 'DOWN') || null;
  });
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const isBookmarked =
    currentUserId && post.bookmarks
      ? post.bookmarks.some((b) => b.userId === currentUserId)
      : false;

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!currentUserId) return;
    const prevVote = userVote;
    const prevScore = voteScore;

    let newScore = voteScore;
    let newVote: 'UP' | 'DOWN' | null = type;

    if (prevVote === type) {
      newVote = null;
      newScore += type === 'UP' ? -1 : 1;
    } else if (prevVote) {
      newScore += type === 'UP' ? 2 : -2;
    } else {
      newScore += type === 'UP' ? 1 : -1;
    }

    setUserVote(newVote);
    setVoteScore(newScore);

    const result = await toggleVote(post.id, type);
    if (!result.success) {
      setUserVote(prevVote);
      setVoteScore(prevScore);
    }
  };

  const avatarColor = post.type === 'CODE' ? '#3b82f6' : '#ec4899';

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <Link href={`/profile/${post.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="post-avatar" style={!post.author.image ? { background: avatarColor } : { background: 'transparent' }}>
            {post.author.image ? (
              <img src={post.author.image} alt={post.author.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              post.author.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
        </Link>
        <div className="post-author-info">
          <Link href={`/profile/${post.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="post-author-name">{post.author.name || 'ผู้ใช้'}</div>
          </Link>
          <div className="post-time" suppressHydrationWarning>{timeAgo(post.createdAt)}</div>
        </div>
        <span className={`post-type-badge ${post.type === 'CODE' ? 'badge-code' : 'badge-prompt'}`} style={{ marginLeft: 'auto' }}>
          {post.type === 'CODE' ? (
            <><Code2 size={12} /> Code Snippet</>
          ) : (
            <><Sparkles size={12} /> AI Prompt</>
          )}
        </span>
      </div>

      {/* Content */}
      <Link href={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h3 className="post-title">{post.title}</h3>
      </Link>
      {post.description && <p className="post-description">{post.description}</p>}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {post.tags.map((tag) => {
            const cleanTag = tag.replace(/^#/, '');
            return (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(cleanTag)}`}
                className="post-tag"
                style={{ textDecoration: 'none' }}
              >
                #{cleanTag}
              </Link>
            );
          })}
        </div>
      )}

      {/* Code block */}
      {post.type === 'CODE' && post.content && (
        <CodeCopyBlock content={post.content} language={post.language} postId={post.id} maxLength={400} />
      )}

      {/* Prompt image */}
      {post.type === 'PROMPT' && post.imageUrl && (
        <div className="post-prompt-image">
          <img src={post.imageUrl} alt={post.title} />
        </div>
      )}

      {/* Prompt text */}
      {post.type === 'PROMPT' && post.content && (
        <PromptCopyBlock text={post.content} postId={post.id} />
      )}

      {/* Actions */}
      <div className="post-actions">
        <div className="vote-group">
          <button
            className={`vote-btn ${userVote === 'UP' ? 'active-up' : ''}`}
            onClick={() => handleVote('UP')}
          >
            <ArrowBigUp size={20} fill={userVote === 'UP' ? 'currentColor' : 'none'} />
          </button>
          <span className="vote-count">{voteScore}</span>
          <button
            className={`vote-btn ${userVote === 'DOWN' ? 'active-down' : ''}`}
            onClick={() => handleVote('DOWN')}
          >
            <ArrowBigDown size={20} fill={userVote === 'DOWN' ? 'currentColor' : 'none'} />
          </button>
        </div>
        <span className="action-spacer" />
        <Link href={`/post/${post.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
          <MessageSquare size={18} /> {post.commentCount}
        </Link>
        <ActionCopyBtn text={post.content || ''} postId={post.id} initialCount={post.copyCount || 0} />
        <span className="action-divider" />
        <button className="action-btn" onClick={() => setIsReportOpen(true)} style={{ color: '#ef4444' }} title="รายงานโพสต์">
          <Flag size={18} />
        </button>
        <button className="action-btn" onClick={() => setIsShareOpen(true)} title="แชร์โพสต์">
          <Share2 size={18} />
        </button>
        <BookmarkButton
          postId={post.id}
          initialBookmarked={isBookmarked}
          initialCollectionId={null}
        />
      </div>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} postId={post.id} />
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} postId={post.id} />
    </div>
  );
}

export default function CollectionDetailClient({
  collection,
  currentUserId,
}: {
  collection: CollectionData;
  currentUserId?: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert(`ลิงก์สำหรับแชร์: ${window.location.href}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Header Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '20px',
            padding: '28px 24px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Folder size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {collection.name}
                  </h1>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: collection.isPublic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      color: collection.isPublic ? '#10b981' : 'var(--text-muted)',
                    }}
                  >
                    {collection.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                    {collection.isPublic ? 'สาธารณะ (Public)' : 'ส่วนตัว (Private)'}
                  </span>
                </div>
                {collection.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                    {collection.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: copiedLink ? '#10b981' : 'var(--primary)',
                color: 'white',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
              {copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'แชร์คอลเลกชัน'}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-default)',
              marginTop: '20px',
              paddingTop: '14px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>สร้างโดย:</span>
              <Link
                href={`/profile/${collection.owner.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {collection.owner.image ? (
                  <img
                    src={collection.owner.image}
                    alt=""
                    style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {collection.owner.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                {collection.owner.name || 'ผู้ใช้'}
              </Link>
            </div>

            <div>
              <span>จำนวน {collection.posts.length} โพสต์ในคอลเลกชันนี้</span>
            </div>
          </div>
        </div>

        {/* Post List */}
        {collection.posts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            <Folder size={48} strokeWidth={1.5} style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              ยังไม่มีโพสต์ในคอลเลกชันนี้
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {collection.isOwner ? 'คุณสามารถบันทึกโพสต์และเลือกจัดใส่คอลเลกชันนี้ได้จากหน้าฟีด' : 'เจ้าของยังไม่ได้เพิ่มโพสต์ลงในคอลเลกชันนี้'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {collection.posts.map((post) => (
              <CollectionPostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
