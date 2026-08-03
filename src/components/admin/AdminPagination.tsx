'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  perPage,
  onPageChange,
}: AdminPaginationProps) {
  if (totalCount === 0) return null;

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalCount);

  // คำนวณช่วงตัวเลขหน้า
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    }
  }

  return (
    <div className="admin-pagination-bar">
      <div>
        แสดง {startItem} ถึง {endItem} จาก {totalCount.toLocaleString()} รายการ
      </div>

      <div className="admin-pagination-btns">
        <button
          className="admin-page-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, idx) => {
          const prevPage = pages[idx - 1];
          const showDots = prevPage && p - prevPage > 1;

          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {showDots && <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>}
              <button
                className={`admin-page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </div>
          );
        })}

        <button
          className="admin-page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="หน้าถัดไป"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
