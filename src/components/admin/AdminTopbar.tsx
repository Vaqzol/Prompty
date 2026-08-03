'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface AdminTopbarProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

export default function AdminTopbar({ user }: AdminTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');

  let placeholder = 'ค้นหา...';
  if (pathname.includes('/tags')) {
    placeholder = 'ค้นหาชื่อแท็ก...';
  } else if (pathname.includes('/posts')) {
    placeholder = 'ค้นหาโพสต์...';
  } else if (pathname.includes('/users')) {
    placeholder = 'ค้นหาชื่อผู้ใช้...';
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (pathname.includes('/tags')) {
        router.push(`/admin/tags?search=${encodeURIComponent(searchTerm.trim())}`);
      } else if (pathname.includes('/users')) {
        router.push(`/admin/users?search=${encodeURIComponent(searchTerm.trim())}`);
      } else {
        router.push(`/admin/posts?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    } else {
      if (pathname.includes('/tags')) {
        router.push('/admin/tags');
      } else if (pathname.includes('/users')) {
        router.push('/admin/users');
      } else {
        router.push('/admin/posts');
      }
    }
  };

  return (
    <header className="admin-topbar">
      <form className="admin-topbar-search" onSubmit={handleSearch}>
        <Search size={16} className="admin-topbar-search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      <div className="admin-topbar-right">
        <button className="admin-topbar-icon-btn" title="การแจ้งเตือน">
          <Bell size={18} />
        </button>

        <button className="admin-topbar-icon-btn" title="ช่วยเหลือ">
          <HelpCircle size={18} />
        </button>

        <div className="admin-topbar-divider" />

        <div className="admin-topbar-user">
          <span className="admin-topbar-username">{user?.name || 'ผู้ดูแลระบบ'}</span>
          <img
            src={user?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt={user?.name || 'Admin'}
            className="admin-topbar-avatar"
          />
        </div>
      </div>
    </header>
  );
}
