'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export type TagSortOption =
  | 'MOST_POSTS'
  | 'FEWEST_POSTS'
  | 'NEWEST'
  | 'OLDEST'
  | 'NAME_ASC';

interface AdminTagFilterDropdownProps {
  status: 'ALL' | 'VISIBLE' | 'HIDDEN';
  sortBy: TagSortOption;
  onChangeFilter: (filters: {
    status: 'ALL' | 'VISIBLE' | 'HIDDEN';
    sortBy: TagSortOption;
  }) => void;
}

export default function AdminTagFilterDropdown({
  status,
  sortBy,
  onChangeFilter,
}: AdminTagFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStatus, setTempStatus] = useState<'ALL' | 'VISIBLE' | 'HIDDEN'>(
    status
  );
  const [tempSortBy, setTempSortBy] = useState<TagSortOption>(sortBy);

  const handleApply = () => {
    onChangeFilter({ status: tempStatus, sortBy: tempSortBy });
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStatus('ALL');
    setTempSortBy('MOST_POSTS');
    onChangeFilter({ status: 'ALL', sortBy: 'MOST_POSTS' });
    setIsOpen(false);
  };

  const hasFilter = status !== 'ALL' || sortBy !== 'MOST_POSTS';

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-default)',
          background: hasFilter ? 'var(--brand-light)' : 'var(--bg-card)',
          color: hasFilter ? 'var(--brand-primary)' : 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        onClick={() => {
          setTempStatus(status);
          setTempSortBy(sortBy);
          setIsOpen(!isOpen);
        }}
      >
        <Filter size={14} />
        <span>ตัวกรอง {hasFilter && '•'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '270px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px' }}>ตัวกรองแท็ก</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ฟิลด์ 1: การเรียงลำดับ */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              การเรียงลำดับ
            </label>
            <select
              value={tempSortBy}
              onChange={(e) => setTempSortBy(e.target.value as TagSortOption)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="MOST_POSTS">จำนวนโพสต์ (มากไปน้อย)</option>
              <option value="FEWEST_POSTS">จำนวนโพสต์ (น้อยไปมาก)</option>
              <option value="NEWEST">สร้างล่าสุด</option>
              <option value="OLDEST">สร้างแรกสุด</option>
              <option value="NAME_ASC">ชื่อแท็ก (A - Z)</option>
            </select>
          </div>

          {/* ฟิลด์ 2: สถานะ */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              สถานะการแสดงผล
            </label>
            <select
              value={tempStatus}
              onChange={(e) =>
                setTempStatus(e.target.value as 'ALL' | 'VISIBLE' | 'HIDDEN')
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="ALL">ทั้งหมด (All)</option>
              <option value="VISIBLE">แสดงผล (Visible)</option>
              <option value="HIDDEN">ซ่อน (Hidden)</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              รีเซ็ต
            </button>
            <button
              onClick={handleApply}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              นำไปใช้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
