'use client';

import './tags.css';
import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import TopContributors, { Contributor } from '@/components/shared/TopContributors';

interface TagItem {
  name: string;
  count: number;
}

interface TagsClientProps {
  tags: TagItem[];
  contributors: Contributor[];
}

export default function TagsClient({ tags, contributors }: TagsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tags-page">
      <header className="tags-header">
        <h1>แท็กทั้งหมด</h1>
        <p>ค้นหาเนื้อหาตามคีย์เวิร์ดและเครื่องมือที่คุณสนใจ</p>
      </header>

      <div className="tags-layout">
        <main className="tags-main">
          <div className="tags-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาชื่อแท็ก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredTags.length === 0 ? (
            <div className="empty-state">ไม่พบแท็กที่ค้นหา</div>
          ) : (
            <div className="tags-grid">
              {filteredTags.map((tag) => {
                const cleanName = tag.name.replace(/^#/, '');
                return (
                  <Link
                    key={tag.name}
                    href={`/tags/${encodeURIComponent(cleanName)}`}
                    className="tag-card-item"
                  >
                    <span className="tag-name-pill">#{cleanName}</span>
                    <span className="tag-count-text">{tag.count} โพสต์</span>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        <aside className="tags-sidebar">
          <TopContributors contributors={contributors} />
        </aside>
      </div>
    </div>
  );
}
