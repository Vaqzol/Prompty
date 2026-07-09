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
          <div className="post-modal-scrollable">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
