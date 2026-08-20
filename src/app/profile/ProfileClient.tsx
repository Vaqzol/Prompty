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
  Globe,
  Lock,
  Check,
  Folder,
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
  githubUrl?: string | null;
  twitterUrl?: string | null;
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

interface CollectionData {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  count: number;
}

/* ===== Main Profile Client ===== */
export default function ProfileClient({
  profile,
  initialPosts,
  initialCollections = [],
}: {
  profile: ProfileData;
  initialPosts: PostData[];
  initialCollections?: CollectionData[];
}) {
  const [filter, setFilter] = useState<'all' | 'CODE' | 'PROMPT' | 'COLLECTIONS'>('all');
  const [posts, setPosts] = useState(initialPosts);
  const [collections, setCollections] = useState<CollectionData[]>(initialCollections);
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [copiedColId, setCopiedColId] = useState<string | null>(null);

  const handleFilterChange = async (newFilter: 'all' | 'CODE' | 'PROMPT' | 'COLLECTIONS') => {
    setFilter(newFilter);
    if (newFilter !== 'COLLECTIONS') {
      const result = await getMyPosts(newFilter === 'all' ? undefined : newFilter);
      setPosts(result);
    }
  };

  const handleCopyColLink = async (colId: string) => {
    const url = `${window.location.origin}/collections/${colId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedColId(colId);
      setTimeout(() => setCopiedColId(null), 2500);
    } catch {
      alert(`ลิงก์สำหรับแชร์: ${url}`);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบโพสต์นี้?')) return;
    await deletePost(postId);
    setPosts(posts.filter((p) => p.id !== postId));
  };

  const handleEditSuccess = async () => {
    const result = await getMyPosts(filter === 'all' || filter === 'COLLECTIONS' ? undefined : filter);
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

          {(profile.githubUrl || profile.twitterUrl) && (
            <div className="profile-socials" style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="btn btn-icon" title="GitHub">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              )}
              {profile.twitterUrl && (
                <a href={profile.twitterUrl} target="_blank" rel="noreferrer" className="btn btn-icon" title="X (Twitter)">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Right content - My posts / Collections */}
      <div className="profile-content">
        <div className="profile-posts-header">
          <h2 className="profile-posts-title">
            {filter === 'COLLECTIONS' ? 'คอลเลกชันของฉัน' : 'โพสต์ของฉัน'}
          </h2>
          <div className="profile-posts-filters">
            {[
              { key: 'all' as const, label: 'ทั้งหมด' },
              { key: 'CODE' as const, label: 'Code Snippets' },
              { key: 'PROMPT' as const, label: 'AI Prompts' },
              { key: 'COLLECTIONS' as const, label: 'คอลเลกชัน' },
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

        {filter === 'COLLECTIONS' ? (
          collections.length === 0 ? (
            <div className="empty-state">
              <p>ยังไม่มีคอลเลกชัน</p>
              <Link href="/bookmarks" style={{ color: 'var(--primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600, marginTop: '8px', display: 'inline-block' }}>
                ไปที่หน้าบุ๊กมาร์กเพื่อสร้างคอลเลกชัน →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {collections.map((col) => (
                <div
                  key={col.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: col.isPublic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                          color: col.isPublic ? '#10b981' : 'var(--text-muted)',
                        }}
                      >
                        {col.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                        {col.isPublic ? 'สาธารณะ' : 'ส่วนตัว'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{col.count} โพสต์</span>
                    </div>

                    <Link href={`/collections/${col.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                        {col.name}
                      </h3>
                    </Link>
                    {col.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {col.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-default)', paddingTop: '12px' }}>
                    <Link
                      href={`/collections/${col.id}`}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      ดูคอลเลกชัน
                    </Link>
                    <button
                      onClick={() => handleCopyColLink(col.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: copiedColId === col.id ? '#10b981' : 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {copiedColId === col.id ? <Check size={14} /> : <Share2 size={14} />}
                      {copiedColId === col.id ? 'ก๊อปแล้ว' : 'แชร์'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : posts.length === 0 ? (
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
