'use client';

import './categories.css';
import { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Server,
  Sparkles,
  Search,
  Container,
  Palette,
  Terminal,
} from 'lucide-react';
import TopContributors, { Contributor } from '@/components/shared/TopContributors';

interface CategoryItem {
  slug: string;
  name: string;
  icon: string;
  description: string;
  postCount: number;
}

interface CategoriesClientProps {
  categories: CategoryItem[];
  contributors: Contributor[];
}

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'Code2':
      return <Code2 size={24} />;
    case 'Server':
      return <Server size={24} />;
    case 'Sparkles':
      return <Sparkles size={24} />;
    case 'Search':
      return <Search size={24} />;
    case 'Container':
      return <Container size={24} />;
    case 'Palette':
      return <Palette size={24} />;
    default:
      return <Terminal size={24} />;
  }
}

export default function CategoriesClient({ categories, contributors }: CategoriesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="categories-page">
      <header className="categories-header">
        <h1>หมวดหมู่ทั้งหมด</h1>
        <p>ค้นหาโพสต์ โค้ด และพรอมต์ตามหมวดหมู่ที่คุณสนใจ</p>
      </header>

      <div className="categories-layout">
        <main className="categories-main">
          <div className="categories-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหมวดหมู่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="categories-grid">
            {filteredCategories.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="category-card">
                <div className="category-icon-circle">{getCategoryIcon(cat.icon)}</div>
                <div className="category-title">{cat.name}</div>
                <span className="category-count-badge">{cat.postCount} โพสต์</span>
              </Link>
            ))}
          </div>
        </main>

        <aside className="categories-sidebar">
          <TopContributors contributors={contributors} />
        </aside>
      </div>
    </div>
  );
}
