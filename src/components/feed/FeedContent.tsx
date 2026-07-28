'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  ChevronDown,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Flag,
  Share2,
  Sparkles,
} from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import CopyBtn from '@/components/shared/CopyBtn';
import CodeCopyBlock from '@/components/shared/CodeCopyBlock';
import PromptCopyBlock from '@/components/shared/PromptCopyBlock';
import PostModal from './PostModal';
import ReportModal from './ReportModal';
import ShareModal from './ShareModal';
import BookmarkButton from '@/components/shared/BookmarkButton';
import { toggleVote } from '@/lib/actions/post';

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


/* ===== Filter Tabs ===== */
function FeedFilterTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div className="feed-filters-container">
      <div className="feed-filters-left">
        {[
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'code', label: 'Code' },
          { key: 'prompt', label: 'Prompt' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`filter-pill ${active === tab.key ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== Post Card ===== */
function PostCard({ post, currentUserId }: { post: PostData; currentUserId?: string }) {
  const userVote: 'UP' | 'DOWN' | null = (() => {
    if (!currentUserId) return null;
    const vote = post.votes.find((v) => v.userId === currentUserId);
    return (vote?.type as 'UP' | 'DOWN') || null;
  })();

  const isBookmarked = currentUserId && post.bookmarks ? post.bookmarks.some((b) => b.userId === currentUserId) : false;
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

      {post.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {post.tags.map((tag) => (
            <span key={tag} className="post-tag">#{tag}</span>
          ))}
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
            onClick={() => toggleVote(post.id, 'UP')}
          >
            <ArrowBigUp size={20} />
          </button>
          <span className="vote-count">{post.voteScore}</span>
          <button
            className={`vote-btn ${userVote === 'DOWN' ? 'active-down' : ''}`}
            onClick={() => toggleVote(post.id, 'DOWN')}
          >
            <ArrowBigDown size={20} />
          </button>
        </div>
        <span className="action-spacer" />
        <Link href={`/post/${post.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
          <MessageSquare size={18} /> {post.commentCount}
        </Link>
        <ActionCopyBtn text={post.content || ''} postId={post.id} initialCount={post.copyCount || 0} />
        <span className="action-divider" />
        <button className="action-btn" onClick={() => setIsReportModalOpen(true)} style={{color: '#ef4444'}}>
          <Flag size={18} />
        </button>
        <button className="action-btn" onClick={() => setIsShareModalOpen(true)}>
          <Share2 size={18} />
        </button>
        <BookmarkButton 
          postId={post.id} 
          initialBookmarked={isBookmarked} 
          initialCollectionId={null} // Feed doesn't know initial collection, which is fine, it will just default to Uncategorized until selected
        />
      </div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        postId={post.id} 
      />
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        postId={post.id} 
      />
    </div>
  );
}

/* ===== Main Feed Content ===== */
export default function FeedContent({ posts, currentUserId }: { posts: PostData[]; currentUserId?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredPosts = activeFilter === 'all'
    ? posts
    : posts.filter((p) => p.type === activeFilter.toUpperCase());

  return (
    <div className="feed-content">
      <FeedFilterTabs active={activeFilter} onChange={setActiveFilter} />

      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <p>ยังไม่มีโพสต์ ลองสร้างโพสต์แรกของคุณ!</p>
        </div>
      ) : (
        filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))
      )}

      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
