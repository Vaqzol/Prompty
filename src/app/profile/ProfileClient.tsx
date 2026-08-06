'use client';

import './profile.css';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Pencil,
  ThumbsUp,
  ClipboardCopy,
  Star,
  Code2,
  MoreVertical,
  Trash2,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  Flag,
} from 'lucide-react';
import { deletePost, getMyPosts, toggleVote } from '@/lib/actions/post';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import CopyBtn from '@/components/shared/CopyBtn';
import CodeCopyBlock from '@/components/shared/CodeCopyBlock';
import PromptCopyBlock from '@/components/shared/PromptCopyBlock';
import BookmarkButton from '@/components/shared/BookmarkButton';
import ReportModal from '@/components/feed/ReportModal';
import ShareModal from '@/components/feed/ShareModal';
import PostModal from '@/components/feed/PostModal';
import hljs from 'highlight.js';

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม. ที่แล้ว`;
  return `${Math.floor(diff / 86400)} วัน ที่แล้ว`;
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  handle: string | null;
  postCount: number;
  totalVoteScore: number;
  totalCopies: number;
  totalPoints: number;
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
  votes?: { userId: string; type: string }[];
  bookmarks?: { userId: string }[];
}

/* ===== Post Card with Menu & Actions ===== */
function ProfilePostCard({
  post,
  onEdit,
  onDelete,
  currentUserId,
}: {
  post: PostData;
  onEdit: () => void;
  onDelete: () => void;
  currentUserId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initialUserVote = (() => {
    if (!currentUserId || !post.votes) return null;
    const vote = post.votes.find((v) => v.userId === currentUserId);
    return (vote?.type as 'UP' | 'DOWN') || null;
  })();

  const [voteScore, setVoteScore] = useState(post.voteScore);
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(initialUserVote);

  const isBookmarked =
    currentUserId && post.bookmarks
      ? post.bookmarks.some((b) => b.userId === currentUserId)
      : false;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="post-card">
      <div className="post-header">
        <span className={`post-type-badge ${post.type === 'CODE' ? 'badge-code' : 'badge-prompt'}`}>
          {post.type === 'CODE' ? (
            <><Code2 size={12} /> Code Snippet</>
          ) : (
            <>✨ AI Prompt</>
          )}
        </span>
        <span className="action-spacer" />
        {/* 3-dot menu */}
        <div className="post-menu-container" ref={menuRef}>
          <button className="post-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className="post-menu-dropdown">
              <button className="post-menu-item" onClick={() => { setMenuOpen(false); onEdit(); }}>
                <Pencil size={16} /> แก้ไขโพสต์
              </button>
              <div className="post-menu-divider" />
              <button className="post-menu-item danger" onClick={() => { setMenuOpen(false); onDelete(); }}>
                <Trash2 size={16} /> ลบโพสต์
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="post-time" style={{ marginBottom: '8px' }}>{timeAgo(post.createdAt)}</div>

      <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
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

      {/* Code block preview */}
      {post.type === 'CODE' && post.content && (
        <CodeCopyBlock content={post.content} language={post.language} postId={post.id} maxLength={300} />
      )}

      {/* Prompt image preview */}
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

        <BookmarkButton postId={post.id} initialBookmarked={isBookmarked} />
      </div>

      {/* Modals */}
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

/* ===== Main Profile Client ===== */
export default function ProfileClient({ profile, initialPosts }: { profile: ProfileData; initialPosts: PostData[] }) {
  const [filter, setFilter] = useState<'all' | 'CODE' | 'PROMPT'>('all');
  const [posts, setPosts] = useState(initialPosts);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);

  const handleFilterChange = async (newFilter: 'all' | 'CODE' | 'PROMPT') => {
    setFilter(newFilter);
    const result = await getMyPosts(newFilter === 'all' ? undefined : newFilter);
    setPosts(result);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบโพสต์นี้?')) return;
    await deletePost(postId);
    setPosts(posts.filter((p) => p.id !== postId));
  };

  const handleEditSuccess = async () => {
    const result = await getMyPosts(filter === 'all' ? undefined : filter);
    setPosts(result);
    setEditingPost(null);
  };

  return (
    <div className="profile-page">
      {/* Left sidebar - Profile card */}
      <aside className="profile-sidebar">
        <div className="profile-card">
          <div className="profile-avatar-container">
            <div className="profile-avatar-large">
              {profile.image ? (
                <img src={profile.image} alt={profile.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
          </div>
          <Link href="/settings/profile" className="profile-edit-icon" title="แก้ไขโปรไฟล์">
            <Pencil size={16} />
          </Link>

          <h2 className="profile-name">{profile.name || 'ผู้ใช้งาน'}</h2>
          <p className="profile-handle-text">@{profile.handle}</p>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <div className="profile-stat-item">
              <div className="profile-stat-icon" style={{ background: '#3b82f6' }}>
                <ThumbsUp size={18} />
              </div>
              <span className="profile-stat-label">คะแนนโหวต</span>
              <span className="profile-stat-value">{profile.totalVoteScore.toLocaleString()}</span>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-icon" style={{ background: '#8b5cf6' }}>
                <ClipboardCopy size={18} />
              </div>
              <span className="profile-stat-label">คัดลอกทั้งหมด</span>
              <span className="profile-stat-value">{profile.totalCopies.toLocaleString()}</span>
            </div>
            <div className="profile-stat-item">
              <div className="profile-stat-icon" style={{ background: '#f59e0b' }}>
                <Star size={18} />
              </div>
              <span className="profile-stat-label">คะแนนรวม</span>
              <span className="profile-stat-value">{profile.totalPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right content - My posts */}
      <div className="profile-content">
        <div className="profile-posts-header">
          <h2 className="profile-posts-title">โพสต์ของฉัน</h2>
          <div className="profile-posts-filters">
            {[
              { key: 'all' as const, label: 'ทั้งหมด' },
              { key: 'CODE' as const, label: 'Code Snippets' },
              { key: 'PROMPT' as const, label: 'AI Prompts' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`profile-filter-pill ${filter === tab.key ? 'active' : ''}`}
                onClick={() => handleFilterChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>ยังไม่มีโพสต์</p>
          </div>
        ) : (
          posts.map((post) => (
            <ProfilePostCard
              key={post.id}
              post={post}
              onEdit={() => setEditingPost(post)}
              onDelete={() => handleDelete(post.id)}
              currentUserId={profile.id}
            />
          ))
        )}
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <PostModal
          isOpen={true}
          onClose={() => setEditingPost(null)}
          onSuccess={handleEditSuccess}
          editMode
          editData={{
            id: editingPost.id,
            type: editingPost.type as 'CODE' | 'PROMPT',
            title: editingPost.title,
            description: editingPost.description || '',
            content: editingPost.content || '',
            language: editingPost.language || '',
            aiModel: editingPost.aiModel || '',
            imageUrl: editingPost.imageUrl || '',
            tags: editingPost.tags,
          }}
        />
      )}
    </div>
  );
}
