'use client';

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
  Copy,
  Share2,
  Bookmark,
  Flag,
} from 'lucide-react';
import { deletePost, getMyPosts } from '@/lib/actions/post';
import PostModal from '@/components/feed/PostModal';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

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
  createdAt: Date | string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    handle: string | null;
  };
}

/* ===== Post Card with Menu ===== */
function ProfilePostCard({ post, onEdit, onDelete }: { post: PostData; onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {post.tags.map((tag) => (
            <span key={tag} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Code block preview */}
      {post.type === 'CODE' && post.content && (
        <div className="post-code-block">
          <div className="post-code-header">
            <span className="post-code-lang">{post.language || 'Code'}</span>
          </div>
          <div className="post-code-content">
            <pre dangerouslySetInnerHTML={{ 
              __html: hljs.highlightAuto(
                post.content.length > 300 ? post.content.slice(0, 300) + '...' : post.content
              ).value 
            }} />
          </div>
        </div>
      )}

      {/* Prompt image preview */}
      {post.type === 'PROMPT' && post.imageUrl && (
        <div className="post-prompt-image">
          <img src={post.imageUrl} alt={post.title} />
        </div>
      )}

      {/* Prompt text */}
      {post.type === 'PROMPT' && post.content && (
        <div className="post-prompt-text" style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: 0 }}>{post.content}</p>
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <div className="vote-group">
          <button className="vote-btn"><ArrowBigUp size={20} /></button>
          <span className="vote-count">{post.voteScore}</span>
          <button className="vote-btn"><ArrowBigDown size={20} /></button>
        </div>
        <span className="action-spacer" />
        <button className="action-btn"><MessageSquare size={18} /> {post.commentCount}</button>
        <button className="action-btn"><Copy size={18} /> 0</button>
        <span className="action-divider" />
        <button className="action-btn" style={{color: '#ef4444'}}><Flag size={18} /></button>
        <button className="action-btn"><Share2 size={18} /></button>
        <button className="action-btn"><Bookmark size={18} /></button>
      </div>
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
          <div className="profile-edit-icon">
            <Pencil size={16} />
          </div>

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
