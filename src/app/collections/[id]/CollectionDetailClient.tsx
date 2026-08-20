'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Folder,
  Globe,
  Lock,
  Share2,
  Check,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Copy,
  Sparkles,
  Code2,
} from 'lucide-react';
import { toggleVote } from '@/lib/actions/post';
import { trackCopy } from '@/lib/actions/copy';
import BookmarkButton from '@/components/shared/BookmarkButton';
import hljs from 'highlight.js';

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
  votes: { userId: string; type: string }[];
  bookmarks: { userId: string }[];
}

interface CollectionData {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: Date | string;
  isOwner: boolean;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
    handle: string | null;
    email: string | null;
  };
  posts: PostData[];
}

function HighlightedCode({ content, language }: { content: string; language: string | null }) {
  const lang = language ? language.toLowerCase() : 'plaintext';
  let highlighted = content;
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(content, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(content).value;
    }
  } catch {
    highlighted = content;
  }

  return (
    <pre className="code-block-pre">
      <code
        className={`hljs ${lang}`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
}

export default function CollectionDetailClient({
  collection,
  currentUserId,
}: {
  collection: CollectionData;
  currentUserId?: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      /* ignore */
    }
  };

  const handleCopyPost = async (postId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
      await trackCopy(postId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '20px',
            padding: '32px 28px',
            marginBottom: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Folder size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {collection.name}
                  </h1>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: collection.isPublic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      color: collection.isPublic ? '#10b981' : 'var(--text-muted)',
                    }}
                  >
                    {collection.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    {collection.isPublic ? 'สาธารณะ (Public)' : 'ส่วนตัว (Private)'}
                  </span>
                </div>
                {collection.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '6px 0 0 0' }}>
                    {collection.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: copiedLink ? '#10b981' : 'var(--primary)',
                color: 'white',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              {copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'แชร์คอลเลกชัน'}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-default)',
              marginTop: '24px',
              paddingTop: '16px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>สร้างโดย:</span>
              <Link
                href={`/profile/${collection.owner.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {collection.owner.image ? (
                  <img
                    src={collection.owner.image}
                    alt=""
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {collection.owner.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                {collection.owner.name || 'ผู้ใช้'}
              </Link>
            </div>

            <div>
              <span>จำนวน {collection.posts.length} โพสต์ในคอลเลกชันนี้</span>
            </div>
          </div>
        </div>

        {/* Post List */}
        {collection.posts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            <Folder size={48} strokeWidth={1.5} style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              ยังไม่มีโพสต์ในคอลเลกชันนี้
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {collection.isOwner ? 'คุณสามารถบันทึกโพสต์และเลือกจัดใส่คอลเลกชันนี้ได้จากหน้าฟีด' : 'เจ้าของยังไม่ได้เพิ่มโพสต์ลงในคอลเลกชันนี้'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {collection.posts.map((post) => {
              const userVote = currentUserId && post.votes
                ? post.votes.find((v) => v.userId === currentUserId)?.type
                : null;
              const isBookmarked = currentUserId && post.bookmarks
                ? post.bookmarks.some((b) => b.userId === currentUserId)
                : false;

              return (
                <div key={post.id} className="post-card" style={{ margin: 0 }}>
                  {/* Post Header */}
                  <div className="post-header">
                    <Link href={`/profile/${post.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="post-avatar">
                        {post.author.image ? (
                          <img src={post.author.image} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <span>{post.author.name?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>
                    </Link>
                    <div className="post-author-info">
                      <Link href={`/profile/${post.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="post-author-name">{post.author.name || 'ผู้ใช้'}</div>
                      </Link>
                      <div className="post-time">@{post.author.handle || post.author.email?.split('@')[0]}</div>
                    </div>
                    <span className={`post-type-badge ${post.type === 'CODE' ? 'badge-code' : 'badge-prompt'}`} style={{ marginLeft: 'auto' }}>
                      {post.type === 'CODE' ? <><Code2 size={12} /> Code Snippet</> : <><Sparkles size={12} /> AI Prompt</>}
                    </span>
                  </div>

                  {/* Post Content */}
                  <Link href={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className="post-title">{post.title}</h3>
                  </Link>
                  {post.description && <p className="post-description">{post.description}</p>}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
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

                  {/* Code / Prompt snippet */}
                  {post.content && (
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <HighlightedCode content={post.content} language={post.language} />
                      <button
                        onClick={() => handleCopyPost(post.id, post.content || '')}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {copiedPostId === post.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedPostId === post.id ? 'คัดลอกแล้ว' : 'คัดลอก'}
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="post-actions">
                    <div className="vote-pill">
                      <button
                        className={`vote-btn ${userVote === 'UP' ? 'active-up' : ''}`}
                        onClick={() => toggleVote(post.id, 'UP')}
                      >
                        <ArrowBigUp size={20} fill={userVote === 'UP' ? 'currentColor' : 'none'} />
                      </button>
                      <span className="vote-count">{post.voteScore}</span>
                      <button
                        className={`vote-btn ${userVote === 'DOWN' ? 'active-down' : ''}`}
                        onClick={() => toggleVote(post.id, 'DOWN')}
                      >
                        <ArrowBigDown size={20} fill={userVote === 'DOWN' ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <Link href={`/post/${post.id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                      <MessageSquare size={18} /> {post.commentCount}
                    </Link>

                    <BookmarkButton
                      postId={post.id}
                      initialBookmarked={isBookmarked}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
