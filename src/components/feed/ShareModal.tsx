'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
// We'll use basic SVGs for social icons to avoid external dependencies
const XIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-6.07-1.72.08-1.1.4-3.05 1.52-3.7.72-.4 1.73-.24 3 .5C17.2 6.3 18.46 7.5 20 7.5c1.65 0 3-1.35 3-3s-1.35-3-3-3c-1.38 0-2.54.94-2.88 2.22-1.43-.72-2.64-.8-3.6-.25-1.64.94-1.95 3.47-2 4.55-2.33.08-4.45.7-6.1 1.72C4.86 8.98 3.96 8.5 3 8.5c-1.65 0-3 1.35-3 3 0 1.32.84 2.44 2.05 2.84-.03.22-.05.44-.05.66 0 3.86 4.5 7 10 7s10-3.14 10-7c0-.22-.02-.44-.05-.66 1.2-.4 2.05-1.54 2.05-2.84zM2.3 11.5c0-1.27 1.03-2.3 2.3-2.3.84 0 1.56.45 1.96 1.14-1.12.63-2.07 1.45-2.8 2.4-.92-.26-1.46-1.02-1.46-1.24zm3.16 5.66c1.17 1.17 2.8 1.63 4.54 1.63 1.75 0 3.38-.46 4.54-1.63.3-.3.3-.8 0-1.1-.3-.3-.8-.3-1.1 0-.88.88-2.14 1.23-3.44 1.23-1.3 0-2.56-.35-3.44-1.23-.3-.3-.8-.3-1.1 0-.3.3-.3.8 0 1.1zM10 14.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zm7 0c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zm-3.23-4.22c.67.12 1.35.32 2.02.6.27.12.58-.02.7-.3.12-.27-.02-.58-.3-.7-2.2-.95-4.75-.95-6.95 0-.28.12-.42.43-.3.7.12.28.43.42.7.3.67-.28 1.35-.48 2.02-.6.7-.12 1.42-.12 2.1 0z" />
  </svg>
);


interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export default function ShareModal({ isOpen, onClose, postId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/post/${postId}` : '';

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareLinks = {
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}`
  };

  const openShare = (link: string) => {
    window.open(link, '_blank', 'width=600,height=400');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">แชร์โพสต์นี้</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content" style={{ padding: '20px' }}>
          {/* Social Icons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button 
              onClick={() => openShare(shareLinks.x)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1F2937', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <XIcon />
            </button>
            <button 
              onClick={() => openShare(shareLinks.facebook)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1877F2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <FacebookIcon />
            </button>
            <button 
              onClick={() => openShare(shareLinks.linkedin)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0A66C2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <LinkedInIcon />
            </button>
            <button 
              onClick={() => openShare(shareLinks.reddit)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FF4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
            >
              <RedditIcon />
            </button>
          </div>

          {/* Copy Link */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#9CA3AF', fontSize: '13px' }}>คัดลอกลิงก์</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={url} 
                readOnly 
                style={{ 
                  flex: 1, 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  background: '#1F2937', 
                  border: '1px solid #374151',
                  color: '#D1D5DB',
                  fontSize: '14px',
                  outline: 'none'
                }} 
              />
              <button 
                onClick={handleCopy}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '8px', 
                  background: '#3B82F6', 
                  color: 'white', 
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} /> คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy size={16} /> คัดลอก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
