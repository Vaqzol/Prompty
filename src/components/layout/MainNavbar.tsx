'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Bookmark, User, Settings, LogOut } from 'lucide-react';
import PromptyLogo from '@/components/shared/PromptyLogo';
import { signOut } from 'next-auth/react';
import PostModal from '@/components/feed/PostModal';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

import type { User as NextAuthUser } from 'next-auth';

const NAV_TABS = [
  { label: 'หน้าหลัก', href: '/' },
  { label: 'กำลังมาแรง', href: '/trending' },
  { label: 'หมวดหมู่', href: '/categories' },
  { label: 'แท็ก', href: '/tags' },
];

export default function MainNavbar({ user }: { user?: NextAuthUser | null }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };
  // ปิด dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <>
      <header className="navbar-wrapper">
        {/* Top bar */}
        <nav className="main-navbar">
          {/* Logo */}
          <Link href="/" className="navbar-logo">
            <PromptyLogo size={38} />
            <span>Prompty</span>
          </Link>

          {/* Search */}
          <form className="navbar-search" onSubmit={handleSearch}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาโพสต์, ผู้ใช้, แท็ก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Navigation Tabs */}
          <div className="navbar-tabs">
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`navbar-tab-link ${pathname === tab.href ? 'active' : ''}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            <button className="btn-create-post" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              สร้างโพสต์
            </button>

            <NotificationDropdown />

            <Link href="/bookmarks" className="btn btn-icon" title="บุ๊กมาร์ก">
              <Bookmark size={20} />
            </Link>

            {/* User Profile Dropdown */}
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <div
                className="navbar-avatar"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ cursor: 'pointer', overflow: 'hidden' }}
              >
                {user?.image ? (
                  <img src={user.image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : user?.name ? (
                  <span style={{ fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User size={18} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {user?.image ? (
                        <img src={user.image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />
                      )}
                    </div>
                    <div className="profile-dropdown-info">
                      <span className="profile-dropdown-name">{user?.name || 'ผู้ใช้งาน'}</span>
                      <span className="profile-dropdown-handle">@{user?.email?.split('@')[0] || 'user'}</span>
                    </div>
                  </div>

                  <Link href="/profile" className="profile-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <User size={18} />
                    โปรไฟล์ของฉัน
                  </Link>
                  
                  <Link href="/settings/profile" className="profile-dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <Settings size={18} />
                    การตั้งค่า
                  </Link>

                  <div className="profile-dropdown-divider"></div>

                  <button className="profile-dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Create Post Modal */}
      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
