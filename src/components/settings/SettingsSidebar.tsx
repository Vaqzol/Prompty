'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Users, Bell, Palette } from 'lucide-react';

const SETTINGS_MENU = [
  { label: 'โปรไฟล์', href: '/settings/profile', icon: User },
  { label: 'บัญชี', href: '/settings/account', icon: Users },
  { label: 'การแจ้งเตือน', href: '/settings/notifications', icon: Bell },
  { label: 'การแสดงผล/ธีม', href: '/settings/appearance', icon: Palette },
];

export default function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="settings-sidebar">
      <h2 className="settings-sidebar-title">การตั้งค่า</h2>
      <p className="settings-sidebar-desc">จัดการบัญชีผู้ใช้ของคุณ</p>
      <nav className="settings-sidebar-nav">
        {SETTINGS_MENU.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`settings-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
