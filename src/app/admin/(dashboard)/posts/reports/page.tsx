'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Check, Trash2, AlertTriangle } from 'lucide-react';
import { getAdminReports, adminResolveReport, adminDismissReport } from '@/lib/actions/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import ReportDetailModal from '@/components/admin/ReportDetailModal';

export default function AdminReportedPostsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING');

  // Modal
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const fetchReports = async (page = 1, currentSearch = search, currentStatus = status) => {
    setLoading(true);
    try {
      const data = await getAdminReports({
        page,
        perPage: 10,
        search: currentSearch,
        status: currentStatus,
      });

      setReports(data.reports);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1, search, status);
  }, [status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(1, search, status);
  };

  const handlePageChange = (page: number) => {
    fetchReports(page, search, status);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้ตามที่ได้รับรายงาน?')) {
      await adminResolveReport(postId);
      fetchReports(currentPage, search, status);
    }
  };

  const handleDismiss = async (postId: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการละเว้นการรายงานนี้?')) {
      await adminDismissReport(postId);
      fetchReports(currentPage, search, status);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">จัดการโพสต์ที่ถูกรายงาน</h1>
        <p className="admin-page-desc">ตรวจสอบและจัดการเนื้อหาที่ผิดกฎ</p>
      </div>

      {/* Search Input Specific to Reports */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '20px', maxWidth: '360px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="ค้นหาโพสต์ หรือ ผู้เขียน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              borderRadius: '10px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
      </form>

      {/* Main Table Card */}
      <div className="admin-table-card">
        {/* Table Header Controls */}
        <div className="admin-table-header">
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            รายการโพสต์ที่ถูกรายงานล่าสุด
          </h2>

          {/* Status Filter Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="PENDING">รอดำเนินการ (PENDING)</option>
            <option value="RESOLVED">จัดการลบแล้ว (RESOLVED)</option>
            <option value="DISMISSED">ละเว้นแล้ว (DISMISSED)</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>โพสต์</th>
                <th style={{ width: '160px' }}>ผู้เขียน</th>
                <th style={{ width: '180px' }}>สาเหตุ</th>
                <th style={{ width: '120px' }}>จำนวนรายงาน</th>
                <th style={{ width: '110px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    กำลังโหลดข้อมูลการรายงาน...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {status === 'PENDING' ? 'ไม่มีรายงานปัญหาที่รอดำเนินการ 🎉' : 'ไม่มีรายการ'}
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.postId} className="admin-table-row">
                    {/* โพสต์ */}
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.postTitle}</td>

                    {/* ผู้เขียน */}
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>@{r.authorHandle}</td>

                    {/* สาเหตุ */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {r.reasons.map((reason: string) => (
                          <span key={reason} className="admin-reason-badge">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* จำนวนรายงาน */}
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.reportCount} ครั้ง</td>

                    {/* จัดการ */}
                    <td>
                      <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="admin-action-btn"
                          onClick={() => setSelectedPostId(r.postId)}
                          title="ดูรายละเอียดการรายงาน"
                        >
                          <Eye size={16} />
                        </button>
                        {status === 'PENDING' && (
                          <>
                            <button
                              className="admin-action-btn resolve"
                              onClick={() => handleDismiss(r.postId)}
                              title="ละเว้น (โพสต์ปลอดภัย)"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="admin-action-btn delete"
                              onClick={() => handleDeletePost(r.postId)}
                              title="ลบโพสต์"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={10}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Report Detail Modal */}
      {selectedPostId && (
        <ReportDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onActionComplete={() => fetchReports(currentPage, search, status)}
        />
      )}
    </div>
  );
}
