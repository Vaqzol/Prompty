'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tag as TagIcon, TrendingUp, Plus, Pencil, Trash2, Flame } from 'lucide-react';
import { getAdminTags, getTagStats } from '@/lib/actions/admin';
import TagModal from '@/components/admin/TagModal';
import AdminTagFilterDropdown from '@/components/admin/AdminTagFilterDropdown';
import AdminPagination from '@/components/admin/AdminPagination';

interface TagItem {
  id: string;
  name: string;
  cleanName: string;
  status: 'VISIBLE' | 'HIDDEN';
  postCount: number;
  createdAt: Date;
}

function AdminTagsContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [stats, setStats] = useState({
    totalTags: 0,
    popularTag: '-',
    popularTagCount: 0,
  });

  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL');
  const [sortBy, setSortBy] = useState<
    'MOST_POSTS' | 'FEWEST_POSTS' | 'NEWEST' | 'OLDEST' | 'NAME_ASC'
  >('MOST_POSTS');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, tagsRes] = await Promise.all([
        getTagStats(),
        getAdminTags({
          page,
          perPage: 10,
          status: statusFilter,
          sortBy,
          search,
        }),
      ]);

      setStats(statsRes);
      setTags(tagsRes.tags as TagItem[]);
      setPages(tagsRes.totalPages);
      setTotalCount(tagsRes.totalCount);
    } catch (err) {
      console.error('Failed to load tags data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sortBy, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setSelectedTag(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: TagItem) => {
    setSelectedTag(tag);
    setModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '6px',
              letterSpacing: '-0.02em',
            }}
          >
            จัดการแท็ก (Manage Tags)
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            จัดการและจัดระเบียบแท็กสำหรับโพสต์ทั้งหมด
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '9999px',
            background: '#0066ff',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={18} />
          <span>สร้างแท็กใหม่</span>
        </button>
      </div>

      {/* 2 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Card 1: แท็กทั้งหมด */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            แท็กทั้งหมด
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '44px',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1,
              }}
            >
              {stats.totalTags.toLocaleString()}
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TagIcon size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: แท็กยอดนิยม */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            แท็กยอดนิยม
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1,
              }}
            >
              <span>{stats.popularTag}</span>
              {stats.popularTag !== 'ยังไม่มีแท็ก' && (
                <Flame size={22} style={{ color: '#ea580c' }} />
              )}
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#fff7ed',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          marginBottom: '32px',
        }}
      >
        {/* Table Header Area */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            position: 'relative',
            zIndex: 20,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            แท็กทั้งหมด
          </h2>
          <AdminTagFilterDropdown
            status={statusFilter}
            sortBy={sortBy}
            onChangeFilter={(filters) => {
              setStatusFilter(filters.status);
              setSortBy(filters.sortBy);
              setPage(1);
            }}
          />
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    width: '35%',
                  }}
                >
                  ชื่อแท็ก
                </th>
                <th
                  style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    width: '25%',
                  }}
                >
                  จำนวนโพสต์
                </th>
                <th
                  style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    width: '25%',
                  }}
                >
                  สถานะ
                </th>
                <th
                  style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    width: '15%',
                    textAlign: 'right',
                  }}
                >
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: 'center',
                      padding: '48px',
                      color: '#94a3b8',
                      fontSize: '14px',
                    }}
                  >
                    กำลังโหลดข้อมูลแท็ก...
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: 'center',
                      padding: '48px',
                      color: '#94a3b8',
                      fontSize: '14px',
                    }}
                  >
                    ไม่พบข้อมูลแท็ก
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr
                    key={tag.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* ชื่อแท็ก Badge */}
                    <td style={{ padding: '16px 24px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background:
                            tag.status === 'VISIBLE' ? '#eff6ff' : '#e2e8f0',
                          color:
                            tag.status === 'VISIBLE' ? '#2563eb' : '#64748b',
                        }}
                      >
                        {tag.name}
                      </span>
                    </td>

                    {/* จำนวนโพสต์ */}
                    <td
                      style={{
                        padding: '16px 24px',
                        color: '#1e293b',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {tag.postCount.toLocaleString()} โพสต์
                    </td>

                    {/* สถานะ */}
                    <td style={{ padding: '16px 24px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background:
                              tag.status === 'VISIBLE' ? '#2563eb' : '#94a3b8',
                          }}
                        />
                        <span
                          style={{
                            color:
                              tag.status === 'VISIBLE' ? '#1e293b' : '#64748b',
                            fontWeight: 500,
                          }}
                        >
                          {tag.status === 'VISIBLE' ? 'แสดงผล' : 'ซ่อน'}
                        </span>
                      </div>
                    </td>

                    {/* จัดการ */}
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '8px',
                        }}
                      >
                        <button
                          onClick={() => handleOpenEdit(tag)}
                          title="แก้ไขแท็ก"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#0066ff';
                            e.currentTarget.style.background = '#eff6ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.background = 'none';
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && tags.length > 0 && (
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            perPage={10}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modal สำหรับสร้าง / แก้ไขแท็ก */}
      <TagModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tag={selectedTag}
        onSuccess={loadData}
      />
    </div>
  );
}

export default function AdminTagsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '14px',
          }}
        >
          กำลังโหลด...
        </div>
      }
    >
      <AdminTagsContent />
    </Suspense>
  );
}
