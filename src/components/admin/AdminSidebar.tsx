'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Tag, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import PromptyLogo from '@/components/shared/PromptyLogo';

interface AdminSidebarProps {
  pendingReportsCount?: number;
}

export default function AdminSidebar({ pendingReportsCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { label: 'ภาพรวม', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'จัดการโพสต์', href: '/admin/posts', icon: FileText, exact: false },
    { label: 'จัดการผู้ใช้', href: '/admin/users', icon: Users, exact: false },
    { label: 'จัดการแท็ก', href: '/admin/tags', icon: Tag, exact: false },
  ];

  return (
    <aside className="admin-sidebar">
      <div>
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-sidebar-logo">
            <PromptyLogo size={36} />
            <div className="admin-sidebar-logo-text">
              <span className="admin-sidebar-logo-title">Prompty Admin</span>
              <span className="admin-sidebar-logo-sub">แดชบอร์ดผู้ดูแลระบบ</span>
            </div>
          </Link>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`admin-sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </Link>

                {/* Sub-item for รายงานปัญหา under จัดการโพสต์ */}
                {item.href === '/admin/posts' && (
                  <Link
                    href="/admin/posts/reports"
                    className={`admin-sidebar-sub-item ${
                      pathname === '/admin/posts/reports' ? 'active' : ''
                    }`}
                  >
                    <span>รายงานปัญหา</span>
                    {pendingReportsCount > 0 && (
                      <span className="admin-badge-count">{pendingReportsCount}</span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <Link
          href="/admin/settings"
          className={`admin-sidebar-item ${pathname.startsWith('/admin/settings') ? 'active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={18} />
            <span>ตั้งค่าระบบ</span>
          </div>
        </Link>

        <button className="admin-sidebar-btn-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
