'use client';

import './trending.css';
import { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Sparkles,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Flag,
  Share2,
} from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import CopyBtn from '@/components/shared/CopyBtn';
import PromptCopyBlock from '@/components/shared/PromptCopyBlock';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import BookmarkButton from '@/components/shared/BookmarkButton';
import ReportModal from '@/components/feed/ReportModal';
import ShareModal from '@/components/feed/ShareModal';
import TopContributors, { Contributor } from '@/components/shared/TopContributors';
import { toggleVote } from '@/lib/actions/post';
import { getTrendingPosts } from '@/lib/actions/trending';

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

function TrendingPostCard({ post, currentUserId }: { post: PostData; currentUserId?: string }) {
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
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} style={{ textDecoration: 'none' }}>
              <span className="post-tag">#{tag}</span>
            </Link>
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
            <pre dangerouslySetInnerHTML={{ 
              __html: hljs.highlightAuto(
                post.content.length > 400 ? post.content.slice(0, 400) + '...' : post.content
              ).value 
            }} />
          </div>
        </div>
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
        <button className="action-btn" onClick={() => setIsReportModalOpen(true)} style={{ color: '#ef4444' }}>
          <Flag size={18} />
        </button>
        <button className="action-btn" onClick={() => setIsShareModalOpen(true)}>
          <Share2 size={18} />
        </button>
        <BookmarkButton 
          postId={post.id} 
          initialBookmarked={isBookmarked} 
          initialCollectionId={null}
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

interface TrendingClientProps {
  initialPosts: PostData[];
  contributors: Contributor[];
  currentUserId?: string;
}

export default function TrendingClient({ initialPosts, contributors, currentUserId }: TrendingClientProps) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = async (newPeriod: 'week' | 'month' | 'all') => {
    setPeriod(newPeriod);
    setLoading(true);
    try {
      const res = await getTrendingPosts(newPeriod);
      setPosts(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trending-page">
      <header className="trending-header">
        <h1>🔥กำลังมาแรง</h1>
        <p>ค้นพบชุดโค้ด พรอมต์ยอดนิยม และผู้มีส่วนร่วมสูงสุดประจำสัปดาห์นี้</p>
      </header>

      <div className="trending-layout">
        <main className="trending-main">
          <div className="trending-section-header">
            <h2 className="trending-section-title">โพสต์ที่กำลังมาแรง</h2>
            <select
              className="period-filter-select"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as 'week' | 'month' | 'all')}
            >
              <option value="week">กรอง: สัปดาห์นี้</option>
              <option value="month">กรอง: เดือนนี้</option>
              <option value="all">กรอง: ทั้งหมด</option>
            </select>
          </div>

          <div className="trending-posts-list">
            {loading ? (
              <div className="empty-state">กำลังโหลดข้อมูล...</div>
            ) : posts.length === 0 ? (
              <div className="empty-state">ยังไม่มีโพสต์ที่กำลังมาแรงในขณะนี้</div>
            ) : (
              posts.map((post) => (
                <TrendingPostCard key={post.id} post={post} currentUserId={currentUserId} />
              ))
            )}
          </div>
        </main>

        <aside className="trending-sidebar">
          <TopContributors contributors={contributors} />
        </aside>
      </div>
    </div>
  );
}
