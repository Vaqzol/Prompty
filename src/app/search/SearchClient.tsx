'use client';

import './search.css';
import { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Sparkles,
  Users,
  Hash,
  SlidersHorizontal,
  ChevronDown,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Flag,
  Share2,
} from 'lucide-react';
import hljs from 'highlight.js';
import CopyBtn from '@/components/shared/CopyBtn';
import CodeCopyBlock from '@/components/shared/CodeCopyBlock';
import PromptCopyBlock from '@/components/shared/PromptCopyBlock';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import BookmarkButton from '@/components/shared/BookmarkButton';
import ReportModal from '@/components/feed/ReportModal';
import ShareModal from '@/components/feed/ShareModal';
import { toggleVote } from '@/lib/actions/post';
import { toggleFollow } from '@/lib/actions/follow';
import { searchPosts } from '@/lib/actions/search';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
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

interface UserData {
  id: string;
  name: string | null;
  handle: string | null;
  image: string | null;
  bio: string | null;
  postCount: number;
  followerCount: number;
  isFollowing: boolean;
}

interface TagData {
  name: string;
  count: number;
}

interface SearchClientProps {
  query: string;
  initialPosts: PostData[];
  initialUsers: UserData[];
  initialTags: TagData[];
  availableLanguages: string[];
  currentUserId?: string;
}

type TabKey = 'all' | 'code' | 'prompt' | 'users' | 'tags';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'ทั้งหมด', icon: null },
  { key: 'code', label: 'Code Snippets', icon: <Code2 size={14} /> },
  { key: 'prompt', label: 'AI Prompts', icon: <Sparkles size={14} /> },
  { key: 'users', label: 'ผู้ใช้', icon: <Users size={14} /> },
  { key: 'tags', label: 'แท็ก', icon: <Hash size={14} /> },
];

const SORT_OPTIONS = [
  { key: 'latest', label: 'ล่าสุด' },
  { key: 'top', label: 'คะแนนสูงสุด' },
];

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม. ที่แล้ว`;
  return `${Math.floor(diff / 86400)} วัน ที่แล้ว`;
}

// ─────────────────────────────────────────────
// Search Post Card
// ─────────────────────────────────────────────
function SearchPostCard({ post, currentUserId }: { post: PostData; currentUserId?: string }) {
  const userVote: 'UP' | 'DOWN' | null = (() => {
    if (!currentUserId) return null;
    const vote = post.votes.find((v) => v.userId === currentUserId);
    return (vote?.type as 'UP' | 'DOWN') || null;
  })();

  const isBookmarked = currentUserId && post.bookmarks
    ? post.bookmarks.some((b) => b.userId === currentUserId)
    : false;

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="post-tag" style={{ textDecoration: 'none' }}>
              #{tag}
            </Link>
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
        <button className="action-btn" onClick={() => setIsReportOpen(true)} style={{ color: '#ef4444' }}>
          <Flag size={18} />
        </button>
        <button className="action-btn" onClick={() => setIsShareOpen(true)}>
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

// ─────────────────────────────────────────────
// User Card
// ─────────────────────────────────────────────
function UserCard({ user, currentUserId }: { user: UserData; currentUserId?: string }) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [followerCount, setFollowerCount] = useState(user.followerCount);

  const handleFollow = async () => {
    if (!currentUserId) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowerCount((c) => (prev ? c - 1 : c + 1));

    const result = await toggleFollow(user.id);
    if (!result.success) {
      setIsFollowing(prev);
      setFollowerCount((c) => (prev ? c + 1 : c - 1));
    }
  };

  return (
    <div className="search-user-card">
      <Link href={`/profile/${user.id}`} className="search-user-avatar">
        {user.image ? (
          <img src={user.image} alt={user.name || ''} />
        ) : (
          <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
        )}
      </Link>
      <div className="search-user-info">
        <Link href={`/profile/${user.id}`} className="search-user-name">
          {user.name || 'ผู้ใช้'}
        </Link>
        {user.handle && <span className="search-user-handle">@{user.handle}</span>}
        {user.bio && <p className="search-user-bio">{user.bio}</p>}
        <div className="search-user-stats">
          <span>{user.postCount} โพสต์</span>
          <span>{followerCount} ผู้ติดตาม</span>
        </div>
      </div>
      {currentUserId && currentUserId !== user.id && (
        <button
          className={`search-follow-btn ${isFollowing ? 'following' : ''}`}
          onClick={handleFollow}
        >
          {isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tag Card
// ─────────────────────────────────────────────
function TagCard({ tag }: { tag: TagData }) {
  return (
    <Link href={`/search?q=${encodeURIComponent(tag.name)}`} className="search-tag-card">
      <div className="search-tag-icon">
        <Hash size={20} />
      </div>
      <div className="search-tag-info">
        <span className="search-tag-name">#{tag.name}</span>
        <span className="search-tag-count">{tag.count} โพสต์</span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Main SearchClient
// ─────────────────────────────────────────────
export default function SearchClient({
  query,
  initialPosts,
  initialUsers,
  initialTags,
  availableLanguages,
  currentUserId,
}: SearchClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [sortBy, setSortBy] = useState('latest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filter posts by tab
  const getFilteredPosts = () => {
    if (activeTab === 'code') return posts.filter((p) => p.type === 'CODE');
    if (activeTab === 'prompt') return posts.filter((p) => p.type === 'PROMPT');
    return posts;
  };

  // Apply language filter on client-side for instant feedback
  const getDisplayPosts = () => {
    let filtered = getFilteredPosts();
    if (selectedLanguages.length > 0 && activeTab === 'code') {
      filtered = filtered.filter(
        (p) => p.language && selectedLanguages.some((l) => l.toLowerCase() === p.language!.toLowerCase())
      );
    }
    return filtered;
  };

  const displayPosts = getDisplayPosts();

  // Handle sort change -> re-fetch from server
  const handleSortChange = async (newSort: string) => {
    setSortBy(newSort);
    setIsSortOpen(false);
    setIsFiltering(true);

    const type = activeTab === 'code' ? 'CODE' : activeTab === 'prompt' ? 'PROMPT' : undefined;
    const result = await searchPosts(query, {
      type,
      language: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      sortBy: newSort as 'latest' | 'top',
    });
    setPosts(result);
    setIsFiltering(false);
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // Counts for tabs
  const codePosts = initialPosts.filter((p) => p.type === 'CODE').length;
  const promptPosts = initialPosts.filter((p) => p.type === 'PROMPT').length;

  const getTabCount = (key: TabKey) => {
    switch (key) {
      case 'all': return initialPosts.length + initialUsers.length + initialTags.length;
      case 'code': return codePosts;
      case 'prompt': return promptPosts;
      case 'users': return initialUsers.length;
      case 'tags': return initialTags.length;
    }
  };

  if (!query) {
    return (
      <div className="search-layout">
        <div className="search-content" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div className="search-empty">
            <Hash size={48} strokeWidth={1.5} />
            <h2>ค้นหาโพสต์, ผู้ใช้, หรือแท็ก</h2>
            <p>พิมพ์คำค้นหาในช่องด้านบนเพื่อเริ่มต้น</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-layout">
      {/* Left Sidebar — Filters */}
      {(activeTab === 'all' || activeTab === 'code' || activeTab === 'prompt') && (
        <aside className="search-sidebar">
          <div className="search-filter-section">
            <div className="search-filter-header">
              <SlidersHorizontal size={16} />
              <span>ตัวกรองขั้นสูง</span>
            </div>
            <p className="search-filter-desc">ปรับแต่งการค้นหาของคุณ</p>
          </div>

          {/* Sort */}
          <div className="search-filter-section">
            <label className="search-filter-label">เรียงลำดับตาม</label>
            <div className="search-sort-dropdown" style={{ position: 'relative' }}>
              <button className="search-sort-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
                <ChevronDown size={14} />
              </button>
              {isSortOpen && (
                <div className="search-sort-options">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      className={`search-sort-option ${sortBy === opt.key ? 'active' : ''}`}
                      onClick={() => handleSortChange(opt.key)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Language filter — only on Code tab */}
          {activeTab === 'code' && availableLanguages.length > 0 && (
            <div className="search-filter-section">
              <label className="search-filter-label">เลือกตามภาษา</label>
              <div className="search-lang-list">
                {availableLanguages.map((lang) => (
                  <label key={lang} className="search-lang-item">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                    />
                    <span>{lang}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Main Content */}
      <div className="search-content">
        {/* Header */}
        <div className="search-header">
          <h1>
            ผลการค้นหาสำหรับ &apos;<span className="search-query-highlight">{query}</span>&apos;
          </h1>
          <p>พบ {initialPosts.length + initialUsers.length + initialTags.length} รายการ</p>
        </div>

        {/* Tabs */}
        <div className="search-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`search-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
              <span className="search-tab-count">{getTabCount(tab.key)}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        <div className={`search-results ${isFiltering ? 'filtering' : ''}`}>
          {/* All tab — Combined results */}
          {activeTab === 'all' && (
            <>
              {displayPosts.length === 0 && initialUsers.length === 0 && initialTags.length === 0 ? (
                <div className="search-no-results">
                  <p>ไม่พบผลลัพธ์ที่ตรงกัน</p>
                </div>
              ) : (
                <>
                  {displayPosts.map((post) => (
                    <SearchPostCard key={post.id} post={post} currentUserId={currentUserId} />
                  ))}

                  {initialUsers.length > 0 && (
                    <div style={{ marginTop: displayPosts.length > 0 ? '24px' : '0' }}>
                      {displayPosts.length > 0 && (
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                          ผู้ใช้ ({initialUsers.length})
                        </h3>
                      )}
                      <div className="search-users-grid">
                        {initialUsers.map((user) => (
                          <UserCard key={user.id} user={user} currentUserId={currentUserId} />
                        ))}
                      </div>
                    </div>
                  )}

                  {initialTags.length > 0 && (
                    <div style={{ marginTop: (displayPosts.length > 0 || initialUsers.length > 0) ? '24px' : '0' }}>
                      {(displayPosts.length > 0 || initialUsers.length > 0) && (
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                          แท็ก ({initialTags.length})
                        </h3>
                      )}
                      <div className="search-tags-grid">
                        {initialTags.map((tag) => (
                          <TagCard key={tag.name} tag={tag} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Code & Prompt tabs */}
          {(activeTab === 'code' || activeTab === 'prompt') && (
            <>
              {displayPosts.length === 0 ? (
                <div className="search-no-results">
                  <p>ไม่พบผลลัพธ์ที่ตรงกัน</p>
                </div>
              ) : (
                displayPosts.map((post) => (
                  <SearchPostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))
              )}
            </>
          )}

          {/* User results */}
          {activeTab === 'users' && (
            <>
              {initialUsers.length === 0 ? (
                <div className="search-no-results">
                  <p>ไม่พบผู้ใช้ที่ตรงกัน</p>
                </div>
              ) : (
                <div className="search-users-grid">
                  {initialUsers.map((user) => (
                    <UserCard key={user.id} user={user} currentUserId={currentUserId} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tag results */}
          {activeTab === 'tags' && (
            <>
              {initialTags.length === 0 ? (
                <div className="search-no-results">
                  <p>ไม่พบแท็กที่ตรงกัน</p>
                </div>
              ) : (
                <div className="search-tags-grid">
                  {initialTags.map((tag) => (
                    <TagCard key={tag.name} tag={tag} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
