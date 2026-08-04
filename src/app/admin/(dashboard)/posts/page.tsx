'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Calendar, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import { getAdminPosts, getDashboardStats, adminDeletePost } from '@/lib/actions/admin';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminFilterDropdown from '@/components/admin/AdminFilterDropdown';
import PostDetailModal from '@/components/admin/PostDetailModal';
import ConfirmActionModal from '@/components/admin/ConfirmActionModal';

export default function AdminManagePostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [stats, setStats] = useState({ totalPosts: 0, todayPosts: 0, pendingReports: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState<{
    type?: 'CODE' | 'PROMPT';
    dateFrom?: string;
    dateTo?: string;
  }>({});

  // Modal
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPostsData = async (page = 1, filterParams = filters) => {
    setLoading(true);
    try {
      const [statsData, postsData] = await Promise.all([
        getDashboardStats(),
        getAdminPosts({
          page,
          perPage: 10,
          search: searchQuery,
          type: filterParams.type,
          dateFrom: filterParams.dateFrom,
          dateTo: filterParams.dateTo,
        }),
      ]);

      setStats(statsData);
      setPosts(postsData.posts);
      setTotalCount(postsData.totalCount);
      setTotalPages(postsData.totalPages);
      setCurrentPage(postsData.currentPage);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsData(1, filters);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    fetchPostsData(page, filters);
  };

  const handleApplyFilter = (newFilters: any) => {
    setFilters(newFilters);
    fetchPostsData(1, newFilters);
  };

  const handleDeletePost = (postId: string) => {
    setDeleteTargetId(postId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await adminDeletePost(deleteTargetId);
      setDeleteTargetId(null);
      fetchPostsData(currentPage, filters);
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">จัดการโพสต์ (Manage Posts)</h1>
        <p className="admin-page-desc">ดูแลและจัดการโพสต์ทั้งหมดในระบบ Prompty</p>
      </div>

      {/* 3 Stat Cards */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-wrapper blue">
              <FileText size={20} />
            </div>
          </div>
          <div>
            <div className="admin-stat-label">โพสต์ทั้งหมด</div>
            <div className="admin-stat-value">{stats.totalPosts.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-wrapper gray">
              <Calendar size={20} />
            </div>
          </div>
          <div>
            <div className="admin-stat-label">โพสต์วันนี้</div>
            <div className="admin-stat-value">{stats.todayPosts.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-wrapper red">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div>
            <div className="admin-stat-label">รายงานปัญหา</div>
            <div className="admin-stat-value red">{stats.pendingReports.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-table-card">
        {/* Table Header Controls */}
        <div className="admin-table-header">
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            รายการโพสต์ล่าสุด
          </h2>

          <AdminFilterDropdown onApplyFilter={handleApplyFilter} />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>ผู้เขียน</th>
                <th style={{ width: '120px' }}>ประเภท</th>
                <th>หัวข้อ</th>
                <th style={{ width: '140px' }}>วันที่</th>
                <th style={{ width: '100px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    กำลังโหลดข้อมูลโพสต์...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    ไม่พบรายการโพสต์
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const dateStr = new Date(post.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={post.id} className="admin-table-row">
                      {/* ผู้เขียน */}
                      <td>
                        <div className="admin-table-author">
                          <img
                            src={
                              post.author.image ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                            }
                            alt=""
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span>@{post.author.handle || post.author.name || 'user'}</span>
                        </div>
                      </td>

                      {/* ประเภท */}
                      <td>
                        <span className={`admin-type-badge ${post.type.toLowerCase()}`}>
                          {post.type === 'CODE' ? 'Code' : 'Prompt'}
                        </span>
                      </td>

                      {/* หัวข้อ */}
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.title}</td>

                      {/* วันที่ */}
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{dateStr}</td>

                      {/* จัดการ */}
                      <td>
                        <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="admin-action-btn"
                            onClick={() => setSelectedPostId(post.id)}
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDeletePost(post.id)}
                            title="ลบโพสต์"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onDeleted={() => fetchPostsData(currentPage, filters)}
        />
      )}

      {/* Delete Post Confirmation Modal */}
      <ConfirmActionModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        variant="delete"
        title="ยืนยันการลบโพสต์?"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้ และข้อมูลจะถูกลบออกจากระบบอย่างถาวร"
        confirmText="ลบข้อมูล"
      />
    </div>
  );
}
