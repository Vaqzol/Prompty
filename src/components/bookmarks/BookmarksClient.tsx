'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowBigUp, ArrowBigDown, MessageSquare, Flag, Share2,
  Bookmark, Code2, Sparkles, Plus, MoreHorizontal, Pencil,
  Trash2, FolderOpen, FolderInput, X, Globe, Lock, Check,
} from 'lucide-react';
import hljs from 'highlight.js';
import { toggleVote } from '@/lib/actions/post';
import { toggleBookmark, createCollection, updateCollection, deleteCollection, moveToCollection } from '@/lib/actions/bookmark';
import ActionCopyBtn from '@/components/shared/ActionCopyBtn';
import CopyBtn from '@/components/shared/CopyBtn';
import CodeCopyBlock from '@/components/shared/CodeCopyBlock';
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
  bookmarkId?: string;
  collectionId?: string | null;
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

interface CollectionData {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  count: number;
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

type FilterType = 'all' | 'CODE' | 'PROMPT' | string;

export default function BookmarksClient({
  posts,
  collections: initialCollections,
  currentUserId,
}: {
  posts: PostData[];
  collections: CollectionData[];
  currentUserId?: string;
}) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [collections, setCollections] = useState<CollectionData[]>(initialCollections);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [hasEnteredMenu, setHasEnteredMenu] = useState(false);
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Add click-outside listener for the sidebar menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      // If a menu is open and the click is outside any sidebar-collection-wrapper, close it
      if (menuOpenId && !target.closest('.sidebar-collection-wrapper')) {
        setMenuOpenId(null);
        setHasEnteredMenu(false);
      }
    }
    
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenId]);

  useEffect(() => {
    if (isCreating && createInputRef.current) createInputRef.current.focus();
  }, [isCreating]);

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  // Filter posts
  const filtered = (() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'CODE') return posts.filter((p) => p.type === 'CODE');
    if (activeFilter === 'PROMPT') return posts.filter((p) => p.type === 'PROMPT');
    // Collection filter
    return posts.filter((p) => p.collectionId === activeFilter);
  })();

  const handleCreate = async () => {
    if (!newName.trim()) { setIsCreating(false); return; }
    const result = await createCollection(newName.trim());
    if (result.success && result.collection) {
      setCollections([...collections, result.collection]);
    } else {
      alert(result.error);
    }
    setNewName('');
    setIsCreating(false);
  };

  const [copiedColId, setCopiedColId] = useState<string | null>(null);

  const handleTogglePrivacy = async (col: CollectionData) => {
    const newStatus = !col.isPublic;
    const result = await updateCollection(col.id, { isPublic: newStatus });
    if (result.success) {
      setCollections(collections.map((c) => (c.id === col.id ? { ...c, isPublic: newStatus } : c)));
    } else {
      alert(result.error);
    }
    setMenuOpenId(null);
  };

  const handleCopyShareLink = async (colId: string) => {
    const url = `${window.location.origin}/collections/${colId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedColId(colId);
      setTimeout(() => setCopiedColId(null), 2500);
    } catch {
      alert(`ลิงก์สำหรับแชร์: ${url}`);
    }
    setMenuOpenId(null);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) { setEditingId(null); return; }
    const result = await updateCollection(id, { name: editName.trim() });
    if (result.success) {
      setCollections(collections.map((c) => c.id === id ? { ...c, name: editName.trim() } : c));
    } else {
      alert(result.error);
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (colId: string) => {
    if (!confirm('ลบคอลเลกชันนี้? โพสต์ที่อยู่ในนี้จะถูกย้ายกลับไปที่ "ทั้งหมด"')) return;
    const result = await deleteCollection(colId);
    if (result.success) {
      setCollections(collections.filter((c) => c.id !== colId));
      if (activeFilter === colId) setActiveFilter('all');
    } else {
      alert(result.error);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="bookmarks-layout">
      {/* ===== Sidebar ===== */}
      <aside className="bookmarks-sidebar">
        <div className="sidebar-section">
          <span className="sidebar-label">ตัวกรอง</span>
          <button
            className={`sidebar-item ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <Bookmark size={16} />
            <span>ทั้งหมด</span>
            <span className="sidebar-count">{posts.length}</span>
          </button>
          <button
            className={`sidebar-item ${activeFilter === 'CODE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('CODE')}
          >
            <Code2 size={16} />
            <span>Code Snippets</span>
            <span className="sidebar-count">{posts.filter((p) => p.type === 'CODE').length}</span>
          </button>
          <button
            className={`sidebar-item ${activeFilter === 'PROMPT' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PROMPT')}
          >
            <Sparkles size={16} />
            <span>AI Prompts</span>
            <span className="sidebar-count">{posts.filter((p) => p.type === 'PROMPT').length}</span>
          </button>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          <span className="sidebar-label">คอลเลกชัน</span>

          {collections.map((col) => (
            <div key={col.id} className="sidebar-collection-wrapper">
              {editingId === col.id ? (
                <div className="sidebar-inline-input">
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(col.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleRename(col.id)}
                    placeholder="ชื่อคอลเลกชัน..."
                    maxLength={50}
                  />
                </div>
              ) : (
                <div
                  className={`sidebar-item ${activeFilter === col.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(col.id)}
                  style={{ paddingRight: '28px' }}
                >
                  {col.isPublic ? <Globe size={15} style={{ color: '#10b981' }} /> : <FolderOpen size={16} />}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
                  <span className="sidebar-count">{col.count}</span>
                  <button
                    className="sidebar-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasEnteredMenu(false);
                      setMenuOpenId(menuOpenId === col.id ? null : col.id);
                    }}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              )}

              {menuOpenId === col.id && (
                <div 
                  className="sidebar-menu-dropdown"
                  onMouseEnter={() => setHasEnteredMenu(true)}
                  onMouseLeave={() => {
                    if (hasEnteredMenu) {
                      setMenuOpenId(null);
                      setHasEnteredMenu(false);
                    }
                  }}
                >
                  <button onClick={() => handleTogglePrivacy(col)}>
                    {col.isPublic ? <Lock size={14} /> : <Globe size={14} />}
                    {col.isPublic ? 'เปลี่ยนเป็นส่วนตัว' : 'เปลี่ยนเป็นสาธารณะ'}
                  </button>
                  <button onClick={() => handleCopyShareLink(col.id)}>
                    {copiedColId === col.id ? <Check size={14} /> : <Share2 size={14} />}
                    {copiedColId === col.id ? 'คัดลอกลิงก์แล้ว!' : 'แชร์คอลเลกชัน'}
                  </button>
                  <button onClick={() => {
                    setEditingId(col.id);
                    setEditName(col.name);
                    setMenuOpenId(null);
                  }}>
                    <Pencil size={14} /> เปลี่ยนชื่อ
                  </button>
                  <button className="danger" onClick={() => handleDelete(col.id)}>
                    <Trash2 size={14} /> ลบ
                  </button>
                </div>
              )}
            </div>
          ))}

          {isCreating ? (
            <div className="sidebar-inline-input">
              <input
                ref={createInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(false); setNewName(''); }
                }}
                onBlur={handleCreate}
                placeholder="ชื่อคอลเลกชันใหม่..."
                maxLength={50}
              />
            </div>
          ) : (
            <button className="sidebar-item sidebar-add-btn" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              <span>สร้างคอลเลกชัน</span>
            </button>
          )}
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="bookmarks-content">
        <div className="bookmarks-header">
          <h1>
            {activeFilter === 'all' && '📌 รายการที่บันทึกไว้'}
            {activeFilter === 'CODE' && '▪️ Code Snippets ที่บันทึก'}
            {activeFilter === 'PROMPT' && '✨ AI Prompts ที่บันทึก'}
            {!['all', 'CODE', 'PROMPT'].includes(activeFilter) &&
              `📁 ${collections.find((c) => c.id === activeFilter)?.name || 'คอลเลกชัน'}`}
          </h1>
          <p>
            {filtered.length === 0
              ? 'ยังไม่มีโพสต์ในคอลเลกชันนี้'
              : `${filtered.length} โพสต์ที่บันทึกไว้`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center' }}>
            <Bookmark size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีโพสต์ที่บันทึกไว้</p>
          </div>
        ) : (
          filtered.map((post) => (
            <SavedPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              collections={collections}
            />
          ))
        )}
      </main>
    </div>
  );
}

/* ===== Saved Post Card ===== */
function SavedPostCard({
  post,
  currentUserId,
  collections,
}: {
  post: PostData;
  currentUserId?: string;
  collections: CollectionData[];
}) {
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(() => {
    if (!currentUserId) return null;
    const vote = post.votes.find((v) => v.userId === currentUserId);
    return (vote?.type as 'UP' | 'DOWN') || null;
  });
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [currentCollectionId, setCurrentCollectionId] = useState(post.collectionId || null);

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!currentUserId) return;
    setUserVote(userVote === type ? null : type);
    await toggleVote(post.id, type);
  };

  const handleMove = async (collectionId: string | null) => {
    if (!post.bookmarkId) return;
    const result = await moveToCollection(post.bookmarkId, collectionId);
    if (result.success) {
      setCurrentCollectionId(collectionId);
    }
    setIsMoveOpen(false);
  };

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <Link href={`/profile/${post.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="post-avatar" style={{ background: post.type === 'CODE' ? '#dbeafe' : '#fce7f3' }}>
            {post.author.image ? (
              <img src={post.author.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span style={{ fontWeight: '600', color: post.type === 'CODE' ? '#3b82f6' : '#ec4899' }}>
                {(post.author.name || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>
        <div className="post-meta">
          <Link href={`/profile/${post.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="post-author">{post.author.name || 'ผู้ใช้งาน'}</span>
          </Link>
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

      {post.type === 'CODE' && post.content && (
        <CodeCopyBlock content={post.content} language={post.language} postId={post.id} maxLength={400} />
      )}

      {post.type === 'PROMPT' && post.imageUrl && (
        <div className="post-prompt-image">
          <img src={post.imageUrl} alt={post.title} />
        </div>
      )}

      {post.type === 'PROMPT' && post.content && (
        <PromptCopyBlock text={post.content} postId={post.id} />
      )}

      {/* Collection badge */}
      {currentCollectionId && (
        <div className="bookmark-collection-badge">
          <FolderOpen size={12} />
          <span>{collections.find((c) => c.id === currentCollectionId)?.name || 'คอลเลกชัน'}</span>
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <div className="vote-group">
          <button className={`vote-btn ${userVote === 'UP' ? 'active-up' : ''}`} onClick={() => handleVote('UP')}>
            <ArrowBigUp size={20} fill={userVote === 'UP' ? 'currentColor' : 'none'} />
          </button>
          <span className="vote-count">{post.voteScore}</span>
          <button className={`vote-btn ${userVote === 'DOWN' ? 'active-down' : ''}`} onClick={() => handleVote('DOWN')}>
            <ArrowBigDown size={20} fill={userVote === 'DOWN' ? 'currentColor' : 'none'} />
          </button>
        </div>
        <span className="action-spacer" />
        <Link href={`/post/${post.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
          <MessageSquare size={18} /> {post.commentCount}
        </Link>
        <ActionCopyBtn text={post.content || ''} postId={post.id} initialCount={post.copyCount || 0} />

        {/* Move to collection button */}
        <div style={{ position: 'relative' }}>
          <button className="action-btn" onClick={() => setIsMoveOpen(!isMoveOpen)} title="ย้ายคอลเลกชัน">
            <FolderInput size={18} />
          </button>
          {isMoveOpen && (
            <div className="move-collection-dropdown">
              <div className="move-dropdown-header">
                <span>ย้ายไปยัง</span>
                <button onClick={() => setIsMoveOpen(false)}><X size={14} /></button>
              </div>
              <button
                className={`move-dropdown-item ${!currentCollectionId ? 'active' : ''}`}
                onClick={() => handleMove(null)}
              >
                <Bookmark size={14} /> ไม่จัดคอลเลกชัน
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  className={`move-dropdown-item ${currentCollectionId === col.id ? 'active' : ''}`}
                  onClick={() => handleMove(col.id)}
                >
                  <FolderOpen size={14} /> {col.name}
                </button>
              ))}
            </div>
          )}
        </div>

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
