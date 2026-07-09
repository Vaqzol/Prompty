'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, Reply } from 'lucide-react';
import { createComment } from '@/lib/actions/post';

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม. ที่แล้ว`;
  return `${Math.floor(diff / 86400)} วัน ที่แล้ว`;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    handle: string | null;
    image: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  comments: CommentData[];
  currentUser?: { id: string; name?: string | null; email?: string | null } | null;
}

export default function CommentSection({ postId, comments, currentUser }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createComment(postId, commentText);
      setCommentText('');
    } catch {
      // handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">ความคิดเห็น ({comments.length})</h3>

      {/* Comment input */}
      {currentUser && (
        <>
          <div className="comment-input-area">
            <div className="comment-avatar">
              {currentUser.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <textarea
              className="comment-textarea"
              placeholder="เพิ่ม ความคิดเห็น"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
            />
          </div>
          <div className="comment-submit-row">
            <button
              className="comment-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? 'กำลังโพสต์...' : 'โพสต์ ความคิดเห็น'}
            </button>
          </div>
        </>
      )}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-vote">
                <button><ArrowBigUp size={16} /></button>
                <span className="comment-vote-count">0</span>
                <button><ArrowBigDown size={16} /></button>
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{comment.user.name || 'ผู้ใช้'}</span>
                  <span className="comment-handle">@{comment.user.handle || comment.user.email?.split('@')[0]}</span>
                  <span className="comment-time">• {timeAgo(comment.createdAt)}</span>
                </div>
                <p className="comment-content">{comment.content}</p>
                <button className="comment-reply-btn">
                  <Reply size={14} />
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
