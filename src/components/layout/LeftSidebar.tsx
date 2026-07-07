'use client';

import {
  Home,
  TrendingUp,
  Code2,
  Pen,
  Search as SearchIcon,
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: TrendingUp, label: 'กำลังมาแรง', active: false },
];

const categories = [
  { icon: Code2, label: 'Frontend' },
  { icon: Pen, label: 'Prompt Art' },
  { icon: SearchIcon, label: 'SEO' },
];

const popularTags = ['#React', '#Python', '#MidjourneyV6'];

export default function LeftSidebar() {
  return (
    <aside className="left-sidebar">
      {/* Main navigation */}
      {navItems.map((item) => (
        <div
          key={item.label}
          className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
        >
          <item.icon size={18} />
          {item.label}
        </div>
      ))}

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Categories */}
      <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textTransform: 'none', letterSpacing: 0 }}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>หมวดหมู่</span>
        <button
          className="sidebar-view-all"
          style={{ padding: '2px 6px', fontSize: '12px' }}
        >
          หมวดหมู่ทั้งหมด
        </button>
      </div>

      {categories.map((cat) => (
        <button key={cat.label} className="sidebar-category-btn">
          <cat.icon size={16} />
          {cat.label}
        </button>
      ))}

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Tags */}
      <div className="sidebar-tags-header">
        <span>แท็กยอดนิยม</span>
        <button>แก้ไขทั้งหมด</button>
      </div>
      <div className="sidebar-tags">
        {popularTags.map((tag) => (
          <button key={tag} className="tag-pill">
            {tag}
          </button>
        ))}
      </div>
    </aside>
  );
}
