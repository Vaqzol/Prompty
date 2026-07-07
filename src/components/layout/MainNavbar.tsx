import Link from 'next/link';
import { Search, Plus, Bell, Bookmark, User } from 'lucide-react';
import PromptyLogo from '@/components/shared/PromptyLogo';

export default function MainNavbar() {
  return (
    <nav className="main-navbar">
      {/* Logo */}
      <Link href="/" className="navbar-logo">
        <PromptyLogo size={38} />
        <span>Prompty</span>
      </Link>

      {/* Search */}
      <div className="navbar-search">
        <Search size={16} className="search-icon" />
        <input type="text" placeholder="ค้นหา" />
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        <Link href="/post/new" className="btn-create-post">
          <Plus size={16} />
          สร้างโพสต์
        </Link>

        <button className="btn btn-icon" title="แจ้งเตือน">
          <Bell size={20} />
        </button>

        <button className="btn btn-icon" title="บุ๊กมาร์ก">
          <Bookmark size={20} />
        </button>

        <div className="navbar-avatar">
          <User size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </nav>
  );
}
