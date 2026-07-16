'use client';

import { useState } from 'react';
import hljs from 'highlight.js';
import {
  Code2,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  Flag,
} from 'lucide-react';
import { toggleVote } from '@/lib/actions/post';
import ReportModal from '@/components/feed/ReportModal';
import ShareModal from '@/components/feed/ShareModal';
import { toggleBookmark } from '@/lib/actions/bookmark';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import CopyBtn from '@/components/shared/CopyBtn';
import PromptCopyBlock from '@/components/shared/PromptCopyBlock';

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
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      handle: string | null;
    }
  }[];
  bookmarks?: { userId: string }[];
  createdAt: Date | string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    handle: string | null;
    image: string | null;
  };
  votes: { userId: string; type: string }[];
}

export default function PostDetailClient({ post, currentUser }: { post: PostData; currentUser?: { id: string } | null }) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const initialBookmarked = currentUser && post.bookmarks ? post.bookmarks.some((b) => b.userId === currentUser.id) : false;
  const [isBookmarked, setIsBookmarked] = useState<boolean>(!!initialBookmarked);

  const userVote = currentUser
    ? post.votes.find((v) => v.userId === currentUser.id)?.type
    : null;

  const avatarColor = post.type === 'CODE' ? '#3b82f6' : '#ec4899';

  return (
    <div className="post-detail-card">
      {/* Header */}
      <div className="post-detail-header">
        <div className="post-detail-avatar" style={!post.author.image ? { background: avatarColor } : { background: 'transparent' }}>
          {post.author.image ? (
            <img src={post.author.image} alt={post.author.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            post.author.name?.charAt(0).toUpperCase() || 'U'
          )}
        </div>
        <div className="post-detail-author-info">
          <div className="post-detail-author-name">
            {post.author.name || 'ผู้ใช้'}
          </div>
          <div className="post-detail-author-handle" suppressHydrationWarning>
            @{post.author.handle || post.author.email?.split('@')[0]} • {timeAgo(post.createdAt)}
          </div>
        </div>
        <span className={`post-type-badge ${post.type === 'CODE' ? 'badge-code' : 'badge-prompt'}`}>
          {post.type === 'CODE' ? (
            <><Code2 size={12} /> Code Snippet</>
          ) : (
            <>✨ AI Prompt</>
          )}
        </span>
      </div>

      {/* Content */}
      <h1 className="post-detail-title">{post.title}</h1>
      {post.description && (
        <p className="post-detail-desc">{post.description}</p>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="post-detail-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Code block */}
      {post.type === 'CODE' && post.content && (
        <div className="post-code-block">
          <div className="post-code-header">
            <span className="post-code-lang">{post.language || 'Code'}</span>
            <CopyBtn text={post.content} postId={post.id} />
          </div>
          <div className="post-code-content">
            <pre dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(post.content).value }} />
          </div>
        </div>
      )}

      {/* Prompt content */}
      {post.type === 'PROMPT' && (
        <>
          {post.imageUrl && (
            <div className="post-prompt-image">
              <img src={post.imageUrl} alt={post.title} />
            </div>
          )}
          {post.content && (
            <PromptCopyBlock text={post.content} postId={post.id} />
          )}
        </>
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
        <button className="action-btn">
          <MessageSquare size={16} /> {post.commentCount}
        </button>
        <ActionCopyBtn text={post.content || ''} postId={post.id} initialCount={post.copyCount || 0} />
        <span className="action-spacer" />
        <button className="action-btn" onClick={() => setIsReportModalOpen(true)} style={{color: '#ef4444'}}>
          <Flag size={16} />
        </button>
        <button className="action-btn" onClick={() => setIsShareModalOpen(true)}>
          <Share2 size={16} />
        </button>
        <button 
          className="action-btn" 
          onClick={async () => {
            if (!currentUser) {
              alert('กรุณาเข้าสู่ระบบก่อน');
              return;
            }
            // Optimistic update
            setIsBookmarked(!isBookmarked);
            const res = await toggleBookmark(post.id);
            if (!res.success) {
              setIsBookmarked(!isBookmarked); // Revert if fail
              alert(res.error);
            }
          }}
          style={{ color: isBookmarked ? '#3B82F6' : undefined }}
        >
          <Bookmark size={16} fill={isBookmarked ? '#3B82F6' : 'none'} />
        </button>
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
