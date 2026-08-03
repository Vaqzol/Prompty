'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface FilterValues {
  type?: 'CODE' | 'PROMPT';
  dateFrom?: string;
  dateTo?: string;
}

interface AdminFilterDropdownProps {
  onApplyFilter: (filters: FilterValues) => void;
}

export default function AdminFilterDropdown({ onApplyFilter }: AdminFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'CODE' | 'PROMPT' | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleApply = () => {
    onApplyFilter({ type, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    setIsOpen(false);
  };

  const handleReset = () => {
    setType(undefined);
    setDateFrom('');
    setDateTo('');
    onApplyFilter({});
    setIsOpen(false);
  };

  const hasFilter = !!type || !!dateFrom || !!dateTo;

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
        onClick={() => setIsOpen(!isOpen)}
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
            width: '280px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>ตัวกรองข้อมูล</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ประเภท */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              ประเภทโพสต์
            </label>
            <select
              value={type || ''}
              onChange={(e) => setType((e.target.value as 'CODE' | 'PROMPT') || undefined)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              <option value="">ทั้งหมด</option>
              <option value="CODE">Code Snippet</option>
              <option value="PROMPT">AI Prompt</option>
            </select>
          </div>

          {/* วันที่เริ่มต้น */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              ตั้งแต่วันที่
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            />
          </div>

          {/* วันที่สิ้นสุด */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              ถึงวันที่
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            />
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
