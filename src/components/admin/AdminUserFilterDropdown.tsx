'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface AdminUserFilterDropdownProps {
  statusFilter: 'ALL' | 'ACTIVE' | 'BANNED';
  onChangeStatusFilter: (status: 'ALL' | 'ACTIVE' | 'BANNED') => void;
}

export default function AdminUserFilterDropdown({
  statusFilter,
  onChangeStatusFilter,
}: AdminUserFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStatus, setTempStatus] = useState<'ALL' | 'ACTIVE' | 'BANNED'>(
    statusFilter
  );

  const handleApply = () => {
    onChangeStatusFilter(tempStatus);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStatus('ALL');
    onChangeStatusFilter('ALL');
    setIsOpen(false);
  };

  const hasFilter = statusFilter !== 'ALL';

  return (
    <div style={{ position: 'relative' }}>
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          background: hasFilter ? '#eff6ff' : '#ffffff',
          color: hasFilter ? '#2563eb' : '#334155',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        onClick={() => {
          setTempStatus(statusFilter);
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
            width: '260px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
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
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
              ตัวกรองผู้ใช้งาน
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* สถานะ */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              สถานะบัญชี
            </label>
            <select
              value={tempStatus}
              onChange={(e) =>
                setTempStatus(e.target.value as 'ALL' | 'ACTIVE' | 'BANNED')
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="ALL">ทั้งหมด (All)</option>
              <option value="ACTIVE">ปกติ (Active)</option>
              <option value="BANNED">ถูกระงับ (Banned)</option>
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
                border: '1px solid #e2e8f0',
                background: 'transparent',
                color: '#64748b',
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
                background: '#0066ff',
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
