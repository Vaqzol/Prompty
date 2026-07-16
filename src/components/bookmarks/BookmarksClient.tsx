'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Flag, Share2, Bookmark, Code2, Sparkles } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { toggleVote } from '@/lib/actions/post';
import { toggleBookmark } from '@/lib/actions/bookmark';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import CopyBtn from '@/components/shared/CopyBtn';
import PromptCopyBlock from '@/components/shared/PromptCopyBlock';
import ReportModal from '@/components/feed/ReportModal';
import ShareModal from '@/components/feed/ShareModal';

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
    handle: string | null;
    image: string | null;
  };
  votes: { userId: string; type: string }[];
  bookmarks?: { userId: string }[];
}

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม. ที่แล้ว`;
  return `${Math.floor(diff / 86400)} วัน ที่แล้ว`;
}



const TABS = [
  { label: 'ทั้งหมดที่บันทึกไว้', value: 'all' },
  { label: '▪️ Code Snippets', value: 'CODE' },
  { label: '✨ AI Prompts', value: 'PROMPT' },
];

export default function BookmarksClient({ posts, currentUserId }: { posts: PostData[]; currentUserId?: string }) {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all' ? posts : posts.filter((p) => p.type === activeTab);

  return (
    <div className="bookmarks-container">
      <div className="bookmarks-header">
        <h1>📌 รายการที่บันทึกไว้</h1>
        <p>รวมชุดโค้ด พรอมต์ และไอเดียทั้งหมดที่คุณบันทึกไว้</p>
      </div>

      {/* Tabs */}
      <div className="bookmarks-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            className={`bookmarks-tab ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center' }}>
          <Bookmark size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีโพสต์ที่บันทึกไว้</p>
        </div>
      ) : (
        filtered.map((post) => (
          <SavedPostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))
      )}
    </div>
  );
}

function SavedPostCard({ post, currentUserId }: { post: PostData; currentUserId?: string }) {
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(() => {
    if (!currentUserId) return null;
    const vote = post.votes.find((v) => v.userId === currentUserId);
    return (vote?.type as 'UP' | 'DOWN') || null;
  });
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!currentUserId) return;
    setUserVote(userVote === type ? null : type);
    await toggleVote(post.id, type);
  };

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-avatar" style={{ background: post.type === 'CODE' ? '#dbeafe' : '#fce7f3' }}>
          {post.author.image ? (
            <img src={post.author.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            <span style={{ fontWeight: '600', color: post.type === 'CODE' ? '#3b82f6' : '#ec4899' }}>
              {(post.author.name || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="post-meta">
          <span className="post-author">{post.author.name || 'ผู้ใช้งาน'}</span>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
        </div>
        <span className={`post-type-badge ${post.type === 'CODE' ? 'badge-code' : 'badge-prompt'}`}>
          {post.type === 'CODE' ? <><Code2 size={12} /> Code Snippet</> : <><Sparkles size={12} /> AI Prompt</>}
        </span>
      </div>

      <Link href={`/post/${post.id}`} className="post-title-link">
        <h3 className="post-title">{post.title}</h3>
      </Link>
      {post.description && <p className="post-description">{post.description}</p>}

      {post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {post.tags.map((tag) => (
            <span key={tag} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      {post.type === 'CODE' && post.content && (
        <div className="post-code-block">
          <div className="post-code-header">
            <span className="post-code-lang">{post.language || 'Code'}</span>
            <CopyBtn text={post.content} postId={post.id} />
          </div>
          <div className="post-code-content">
            <pre dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(post.content.length > 400 ? post.content.slice(0, 400) + '...' : post.content).value }} />
          </div>
        </div>
      )}

      {post.type === 'PROMPT' && post.imageUrl && (
        <div className="post-prompt-image">
          <img src={post.imageUrl} alt={post.title} />
        </div>
      )}

      {post.type === 'PROMPT' && post.content && (
        <PromptCopyBlock text={post.content} postId={post.id} />
      )}

      {/* Actions */}
      <div className="post-actions">
        <div className="vote-group">
          <button className={`vote-btn ${userVote === 'UP' ? 'active-up' : ''}`} onClick={() => handleVote('UP')}>
            <ArrowBigUp size={20} />
          </button>
          <span className="vote-count">{post.voteScore}</span>
          <button className={`vote-btn ${userVote === 'DOWN' ? 'active-down' : ''}`} onClick={() => handleVote('DOWN')}>
            <ArrowBigDown size={20} />
          </button>
        </div>
        <span className="action-spacer" />
        <Link href={`/post/${post.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
          <MessageSquare size={18} /> {post.commentCount}
        </Link>
        <ActionCopyBtn text={post.content || ''} postId={post.id} initialCount={post.copyCount || 0} />
        <span className="action-divider" />
        <button className="action-btn" onClick={() => setIsReportOpen(true)} style={{ color: '#ef4444' }}>
          <Flag size={18} />
        </button>
        <button className="action-btn" onClick={() => setIsShareOpen(true)}>
          <Share2 size={18} />
        </button>
        <button
          className="action-btn"
          onClick={async () => {
            setIsBookmarked(!isBookmarked);
            await toggleBookmark(post.id);
          }}
          style={{ color: isBookmarked ? '#3B82F6' : undefined }}
        >
          <Bookmark size={18} fill={isBookmarked ? '#3B82F6' : 'none'} />
        </button>
      </div>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} postId={post.id} />
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} postId={post.id} />
    </div>
  );
}
