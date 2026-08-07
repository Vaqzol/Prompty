'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function PostDetailModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const onDismiss = () => {
    router.back();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onDismiss();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && link.href) {
      try {
        const url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          router.push(url.pathname + url.search);
        }
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div
      ref={overlayRef}
      className="post-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="post-modal-wrapper">
        <button className="post-modal-close-outside" onClick={onDismiss}>
          <X size={28} />
        </button>
        <div className="post-modal-content">
          <div className="post-modal-scrollable" onClick={handleContentClick}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
