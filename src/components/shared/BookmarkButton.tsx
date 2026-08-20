'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, FolderOpen, X, Plus } from 'lucide-react';
import { toggleBookmark, getCollections } from '@/lib/actions/bookmark';

interface Collection {
  id: string;
  name: string;
  count: number;
}

export default function BookmarkButton({
  postId,
  initialBookmarked,
  initialCollectionId = null,
}: {
  postId: string;
  initialBookmarked: boolean;
  initialCollectionId?: string | null;
}) {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCollectionId, setCurrentCollectionId] = useState<string | null>(initialCollectionId);
  const [hasEntered, setHasEntered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load collections when opening dropdown
  const loadCollections = async () => {
    if (collections.length > 0) return;
    setLoading(true);
    const cols = await getCollections();
    setCollections(cols);
    setLoading(false);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleIconClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isBookmarked) {
      // Unsave immediately
      setIsBookmarked(false);
      setCurrentCollectionId(null);
      const result = await toggleBookmark(postId);
      if (!result.success) {
        setIsBookmarked(true); // Revert
        alert(result.error);
      } else {
        router.refresh();
      }
    } else {
      // Open dropdown to select collection, don't save yet
      setHasEntered(false);
      setIsOpen(!isOpen);
      if (!isOpen) {
        loadCollections();
      }
    }
  };

  const handleSelectCollection = async (colId: string | null) => {
    // Save to the selected collection
    setIsBookmarked(true);
    setCurrentCollectionId(colId);
    setIsOpen(false);
    
    const res = await toggleBookmark(postId, colId || undefined);
    if (!res.success) {
      setIsBookmarked(false);
      setCurrentCollectionId(null);
      alert(res.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="action-btn"
        onClick={handleIconClick}
        style={{ color: isBookmarked ? '#3B82F6' : undefined }}
      >
        <Bookmark size={18} fill={isBookmarked ? '#3B82F6' : 'none'} />
      </button>

      {isOpen && !isBookmarked && (
        <div 
          className="move-collection-dropdown" 
          style={{ bottom: 'calc(100% + 8px)', right: 0 }}
          onMouseEnter={() => setHasEntered(true)}
          onMouseLeave={() => {
            if (hasEntered) {
              setIsOpen(false);
              setHasEntered(false);
            }
          }}
        >
          <div className="move-dropdown-header">
            <span>บันทึกไปยัง...</span>
            <button onClick={(e) => { e.preventDefault(); setIsOpen(false); }}>
              <X size={14} />
            </button>
          </div>
          
          <button
            className={`move-dropdown-item ${!currentCollectionId ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleSelectCollection(null); }}
          >
            <Bookmark size={14} /> ไม่จัดคอลเลกชัน
          </button>
          
          {loading ? (
            <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
          ) : collections.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>ยังไม่มีคอลเลกชัน</div>
          ) : (
            collections.map((col) => (
              <button
                key={col.id}
                className={`move-dropdown-item ${currentCollectionId === col.id ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleSelectCollection(col.id); }}
              >
                <FolderOpen size={14} /> {col.name}
              </button>
            ))
          )}
          
          <div style={{ padding: '4px', borderTop: '1px solid var(--border-default)', marginTop: '4px' }}>
            <Link 
              href="/bookmarks" 
              className="move-dropdown-item" 
              style={{ color: 'var(--brand-primary)' }}
            >
              <Plus size={14} /> สร้างคอลเลกชันใหม่
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
