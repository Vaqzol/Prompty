'use client';

import { useState, useEffect } from 'react';
import { X, ThumbsUp, MessageSquare, Trash2 } from 'lucide-react';
import { getAdminPostDetail, adminDeletePost } from '@/lib/actions/admin';

interface PostDetailModalProps {
  postId: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function PostDetailModal({ postId, onClose, onDeleted }: PostDetailModalProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const data = await getAdminPostDetail(postId);
        setPost(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [postId]);

  const handleDelete = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) {
      setDeleting(true);
      await adminDeletePost(postId);
      onDeleted?.();
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-container" style={{ padding: '40px', textAlign: 'center' }}>
          กำลังโหลดรายละเอียด...
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-container" style={{ padding: '40px', textAlign: 'center' }}>
          ไม่พบข้อมูลโพสต์นี้
          <button className="btn" style={{ marginTop: '16px' }} onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>รายละเอียดโพสต์</span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>วันที่ {formattedDate}</div>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body">
          {/* ฝั่งซ้าย: เนื้อหาโพสต์ */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {post.title}
            </h2>
            {post.description && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                {post.description}
              </p>
            )}

            {/* Prompt Image / Code Box */}
            {post.type === 'PROMPT' && post.imageUrl && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  style={{ width: '100%', maxHeight: '360px', objectFit: 'cover' }}
                />
              </div>
            )}

            {post.content && (
              <div
                style={{
                  background: 'var(--bg-code)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: '#f8fafc',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                {post.content}
              </div>
            )}

            {/* Footer inside left column */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
              <button
                className="btn"
                style={{
                  color: 'var(--error)',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={16} />
                <span>ลบโพสต์นี้</span>
              </button>
            </div>
          </div>

          {/* ฝั่งขวา: ข้อมูลผู้เขียน & สถิติ */}
          <div className="admin-modal-right-box">
            {/* ผู้เขียน */}
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                ผู้แต่ง
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={
                    post.author.image ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                  }
                  alt={post.author.name || ''}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {post.author.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    @{post.author.handle || 'user'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                โพสต์ทั้งหมด: <strong style={{ color: 'var(--text-primary)' }}>{post.author._count.posts}</strong>
              </div>
            </div>

            {/* แท็ก */}
            {post.tags && post.tags.length > 0 && (
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  แท็ก
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {post.tags.map((t: string) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '12px',
                        background: 'var(--bg-card)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* สถิติ */}
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                สถิติ
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <ThumbsUp size={14} /> คะแนนโหวต
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{post._count.votes}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <MessageSquare size={14} /> ความคิดเห็น
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{post._count.comments}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
