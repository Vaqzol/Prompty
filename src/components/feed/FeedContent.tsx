'use client';

import { useState, useEffect } from 'react';
import {
  Code2,
  ImageIcon,
  ChevronDown,
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Copy,
  Flag,
  Share2,
  Bookmark,
  Check,
} from 'lucide-react';

/* ===== Post Composer ===== */
function PostComposer() {
  return (
    <div className="post-composer">
      <div className="composer-row">
        <div className="composer-avatar" />
        <input
          type="text"
          className="composer-input"
          placeholder="แบ่งปันCode หรือ Promptของคุณที่นี่"
          readOnly
        />
        <button className="composer-post-btn">โพสต์</button>
      </div>
      <div className="composer-actions">
        <button className="composer-action-btn">
          <Code2 size={18} style={{ color: '#2563eb' }} />
        </button>
        <button className="composer-action-btn">
          <ImageIcon size={18} style={{ color: '#65676b' }} />
        </button>
      </div>
    </div>
  );
}

/* ===== Filter Tabs ===== */
function FeedFilterTabs() {
  const [active, setActive] = useState('all');

  return (
    <div className="feed-filters">
      {[
        { key: 'all', label: 'ทั้งหมด' },
        { key: 'code', label: 'Code' },
        { key: 'prompt', label: 'Prompt' },
      ].map((tab) => (
        <button
          key={tab.key}
          className={`filter-pill ${active === tab.key ? 'active' : ''}`}
          onClick={() => setActive(tab.key)}
        >
          {tab.label}
        </button>
      ))}
      <button className="filter-sort">
        <span>🔥</span>
        มาแรง
        <ChevronDown size={14} />
      </button>
    </div>
  );
}

/* ===== Copy Button ===== */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      className="post-code-copy"
      onClick={handleCopy}
      style={copied ? { color: '#22c55e' } : {}}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
    </button>
  );
}

/* ===== Code Snippet Post ===== */
function CodeSnippetPost() {
  const code = `export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              Logo
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}`;

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-avatar" style={{ background: '#3b82f6' }}>
          A
        </div>
        <div className="post-author-info">
          <div className="post-author-name">Alex Dev</div>
          <div className="post-time">2ชม. ที่แล้ว</div>
        </div>
        <span className="post-type-badge badge-code">
          <Code2 size={12} />
          Code Snippet
        </span>
      </div>

      {/* Content */}
      <h3 className="post-title">Responsive React Navbar</h3>
      <p className="post-description">
        A simple tailwind navbar component.
      </p>
      <div className="post-tag">#React</div>

      {/* Code block */}
      <div className="post-code-block">
        <div className="post-code-header">
          <span className="post-code-lang">React</span>
          <CopyBtn text={code} />
        </div>
        <div className="post-code-content">
          <pre>{code}</pre>
        </div>
      </div>

      {/* Actions */}
      <div className="post-actions">
        <div className="vote-group">
          <button className="vote-btn">
            <ArrowBigUp size={20} />
          </button>
          <span className="vote-count">342</span>
          <button className="vote-btn">
            <ArrowBigDown size={20} />
          </button>
        </div>
        <button className="action-btn">
          <MessageSquare size={16} /> 12
        </button>
        <button className="action-btn">
          <Copy size={16} /> 45
        </button>
        <span className="action-spacer" />
        <button className="action-btn">
          <Flag size={16} />
        </button>
        <button className="action-btn">
          <Share2 size={16} />
        </button>
        <button className="action-btn">
          <Bookmark size={16} />
        </button>
      </div>
    </div>
  );
}

/* ===== AI Prompt Post ===== */
function AiPromptPost() {
  const promptText = `"Futuristic landscape with glowing neon trees, cosmic sky, highly detailed, 8k resolution, cinematic lighting, cyberpunk aesthetic, reflective water surfaces, deep purple and cyan hues."`;
  
  // สร้าง state เก็บตำแหน่งดาวเพื่อป้องกัน Hydration Error (ให้สุ่มหลังจากเรนเดอร์ฝั่งไคลเอนต์เท่านั้น)
  const [stars, setStars] = useState<{ top: number; left: number; size: number; opacity: number }[]>([]);

  useEffect(() => {
    setStars(
      [...Array(20)].map(() => ({
        top: Math.random() * 40,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.5,
      }))
    );
  }, []);

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-avatar" style={{ background: '#ec4899' }}>
          S
        </div>
        <div className="post-author-info">
          <div className="post-author-name">Sarah Art</div>
          <div className="post-time">4ชม. ที่แล้ว</div>
        </div>
        <span className="post-type-badge badge-prompt">
          ✨ AI Prompt
        </span>
      </div>

      {/* Content */}
      <h3 className="post-title">Cyberpunk Landscape</h3>
      <p className="post-description">
        Prompt used for my latest series.
      </p>
      <div className="post-tag">#Cyberpunk</div>

      {/* Image preview */}
      <div className="post-prompt-image">
        <div
          style={{
            width: '100%',
            height: '280px',
            background: 'linear-gradient(135deg, #1a0533 0%, #0d1b2a 30%, #1b2838 50%, #0a192f 70%, #2d1b69 100%)',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative elements to simulate cyberpunk landscape */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
            background: 'linear-gradient(0deg, rgba(6,182,212,0.2), transparent)',
          }} />
          <div style={{
            position: 'absolute', top: '20%', left: '15%', width: '3px', height: '45%',
            background: 'linear-gradient(180deg, #06b6d4, #8b5cf6)',
            borderRadius: '2px', boxShadow: '0 0 12px #06b6d4',
          }} />
          <div style={{
            position: 'absolute', top: '15%', left: '35%', width: '4px', height: '50%',
            background: 'linear-gradient(180deg, #a855f7, #ec4899)',
            borderRadius: '2px', boxShadow: '0 0 15px #a855f7',
          }} />
          <div style={{
            position: 'absolute', top: '25%', right: '25%', width: '3px', height: '40%',
            background: 'linear-gradient(180deg, #06b6d4, #22d3ee)',
            borderRadius: '2px', boxShadow: '0 0 10px #06b6d4',
          }} />
          <div style={{
            position: 'absolute', top: '18%', right: '40%', width: '2px', height: '35%',
            background: 'linear-gradient(180deg, #d946ef, #8b5cf6)',
            borderRadius: '2px', boxShadow: '0 0 8px #d946ef',
          }} />
          {/* Stars */}
          {stars.map((star, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: 'white',
              borderRadius: '50%',
              opacity: star.opacity,
            }} />
          ))}
          {/* Water reflection */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%',
            background: 'linear-gradient(0deg, rgba(6,182,212,0.15), transparent)',
            backdropFilter: 'blur(2px)',
          }} />
        </div>
      </div>

      {/* Prompt text */}
      <div className="post-prompt-text">
        <p>{promptText}</p>
        <CopyBtn text={promptText} />
      </div>

      {/* Actions */}
      <div className="post-actions">
        <div className="vote-group">
          <button className="vote-btn active-up">
            <ArrowBigUp size={20} />
          </button>
          <span className="vote-count">892</span>
          <button className="vote-btn">
            <ArrowBigDown size={20} />
          </button>
        </div>
        <button className="action-btn">
          <MessageSquare size={16} /> 8
        </button>
        <button className="action-btn">
          <Copy size={16} /> 120
        </button>
        <span className="action-spacer" />
        <button className="action-btn">
          <Flag size={16} />
        </button>
        <button className="action-btn">
          <Share2 size={16} />
        </button>
        <button className="action-btn">
          <Bookmark size={16} />
        </button>
      </div>
    </div>
  );
}

/* ===== Main Feed Content ===== */
export default function FeedContent() {
  return (
    <div className="feed-content">
      <PostComposer />
      <FeedFilterTabs />
      <CodeSnippetPost />
      <AiPromptPost />
    </div>
  );
}
