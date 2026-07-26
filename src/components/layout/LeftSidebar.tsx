'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  TrendingUp,
  Code2,
  Sparkles,
  Search as SearchIcon,
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: TrendingUp, label: 'กำลังมาแรง', href: '/trending' },
];

const categories = [
  { icon: Code2, label: 'Frontend', href: '/categories/frontend' },
  { icon: Sparkles, label: 'Prompt Art', href: '/categories/prompt-art' },
  { icon: SearchIcon, label: 'SEO', href: '/categories/seo' },
];

const popularTags = ['React', 'Python', 'Midjourney'];

export default function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="left-sidebar">
      {/* Main navigation */}
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        );
      })}

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Categories */}
      <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textTransform: 'none', letterSpacing: 0 }}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>หมวดหมู่</span>
        <Link
          href="/categories"
          className="sidebar-view-all"
          style={{ padding: '2px 6px', fontSize: '12px', textDecoration: 'none' }}
        >
          หมวดหมู่ทั้งหมด
        </Link>
      </div>

      {categories.map((cat) => (
        <Link
          key={cat.label}
          href={cat.href}
          className="sidebar-category-btn"
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <cat.icon size={16} />
          {cat.label}
        </Link>
      ))}

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Tags */}
      <div className="sidebar-tags-header">
        <span>แท็กยอดนิยม</span>
        <Link href="/tags" style={{ fontSize: '12px', textDecoration: 'none', color: 'var(--brand-primary)' }}>
          ทั้งหมด
        </Link>
      </div>
      <div className="sidebar-tags">
        {popularTags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="tag-pill"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            #{tag}
          </Link>
        ))}
      </div>
    </aside>
  );
}

