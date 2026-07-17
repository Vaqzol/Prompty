'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  ThumbsUp,
  ClipboardCopy,
  Star,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  UserPlus,
  UserMinus,
  Copy,
} from 'lucide-react';
import { toggleVote } from '@/lib/actions/post';
import { toggleFollow } from '@/lib/actions/follow';
import { trackCopy } from '@/lib/actions/copy';
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


interface PublicProfileData {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  handle: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
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

export default function PublicProfileClient({
  profile,
  initialPosts,
  initialIsFollowing,
  currentUserId,
}: {
  profile: PublicProfileData;
  initialPosts: PostData[];
  initialIsFollowing: boolean;
  currentUserId?: string;
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const filteredPosts = initialPosts.filter((post) => {
    if (activeTab === 'all') return true;
    return post.type === activeTab;
  });

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    setLoadingFollow(true);
    const result = await toggleFollow(profile.id);
    if (result.success) {
      setIsFollowing(result.isFollowing!);
      setFollowerCount((prev) => (result.isFollowing ? prev + 1 : prev - 1));
    }
    setLoadingFollow(false);
  };

  return (
    <div className="profile-container">
      {/* Sidebar Profile Info */}
      <aside className="profile-sidebar">
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.image ? (
              <img src={profile.image} alt="avatar" />
            ) : (
              <span className="profile-avatar-placeholder">
                {(profile.name || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="profile-name">{profile.name || 'ผู้ใช้งาน'}</h1>
          <p className="profile-handle">@{profile.handle || 'user'}</p>
          
          <button
            className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-block`}
            style={{ marginTop: '16px' }}
            onClick={handleFollowToggle}
            disabled={loadingFollow}
          >
            {isFollowing ? (
              <><UserMinus size={16} style={{ marginRight: '8px' }} /> เลิกติดตาม</>
            ) : (
              <><UserPlus size={16} style={{ marginRight: '8px' }} /> ติดตาม</>
            )}
          </button>

          <p className="profile-bio">{profile.bio || 'ยังไม่มีคำอธิบายตัวตน'}</p>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{followerCount}</span>
              <span className="stat-label">ผู้ติดตาม</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile.followingCount}</span>
              <span className="stat-label">กำลังติดตาม</span>
            </div>
          </div>

          <div className="profile-socials" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="btn btn-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            )}
            {profile.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noreferrer" className="btn btn-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
          </div>
        </div>

        <div className="profile-achievements">
          <h3>ความสำเร็จ</h3>
          <div className="achievement-item">
            <div className="achievement-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <ThumbsUp size={18} />
            </div>
            <div className="achievement-info">
              <span className="achievement-value">{profile.totalVoteScore}</span>
              <span className="achievement-label">คะแนนโหวต</span>
            </div>
          </div>
          <div className="achievement-item">
            <div className="achievement-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <ClipboardCopy size={18} />
            </div>
            <div className="achievement-info">
              <span className="achievement-value">{profile.totalCopies}</span>
              <span className="achievement-label">ถูกคัดลอก</span>
            </div>
          </div>
          <div className="achievement-item">
            <div className="achievement-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <Star size={18} />
            </div>
            <div className="achievement-info">
              <span className="achievement-value">{profile.totalPoints}</span>
              <span className="achievement-label">แต้มรวม</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="profile-content">
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            ผลงานทั้งหมด ({profile.postCount})
          </button>
          <button className={`profile-tab ${activeTab === 'CODE' ? 'active' : ''}`} onClick={() => setActiveTab('CODE')}>
            Code Snippets
          </button>
          <button className={`profile-tab ${activeTab === 'PROMPT' ? 'active' : ''}`} onClick={() => setActiveTab('PROMPT')}>
            AI Prompts
          </button>
        </div>

        <div className="profile-posts">
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <p>ยังไม่มีโพสต์</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <span className={`post-type-badge ${post.type === 'CODE' ? 'badge-code' : 'badge-prompt'}`}>
                    {post.type === 'CODE' ? <><Code2 size={12} /> Code Snippet</> : <>✨ AI Prompt</>}
                  </span>
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

                {post.type === 'CODE' && post.content && (
                  <div className="post-code-block">
                    <div className="post-code-header">
                      <span className="post-code-lang">{post.language || 'Code'}</span>
                      <button className="post-code-copy" onClick={async () => {
                        await navigator.clipboard.writeText(post.content!);
                        await trackCopy(post.id);
                      }}>
                        <Copy size={14} /> คัดลอก
                      </button>
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

                {post.type === 'PROMPT' && post.imageUrl && (
                  <div className="post-prompt-image">
                    <img src={post.imageUrl} alt={post.title} />
                  </div>
                )}

                {post.type === 'PROMPT' && post.content && (
                  <div className="post-prompt-text">
                    <p>{post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}</p>
                  </div>
                )}

                <div className="post-actions">
                  <div className="vote-group">
                    <button className="vote-btn" onClick={() => toggleVote(post.id, 'UP')}><ArrowBigUp size={20} /></button>
                    <span className="vote-count">{post.voteScore}</span>
                    <button className="vote-btn" onClick={() => toggleVote(post.id, 'DOWN')}><ArrowBigDown size={20} /></button>
                  </div>
                  <span className="action-spacer" />
                  <Link href={`/post/${post.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                    <MessageSquare size={18} /> {post.commentCount}
                  </Link>
                  <button className="action-btn" onClick={async () => {
                    if (post.content) {
                      await navigator.clipboard.writeText(post.content);
                      await trackCopy(post.id);
                    }
                  }}>
                    <Copy size={18} />
                  </button>
                  <span className="action-divider" />
                  <button className="action-btn"><Share2 size={18} /></button>
                  <button className="action-btn"><Bookmark size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
