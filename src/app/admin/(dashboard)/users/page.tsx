'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, UserPlus, Ban, Plus, Pencil, Trash2, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { getAdminUsers, getUserStats } from '@/lib/actions/admin';
import UserEditModal from '@/components/admin/UserEditModal';
import AddAdminModal from '@/components/admin/AddAdminModal';
import DeleteUserModal from '@/components/admin/DeleteUserModal';
import AdminUserFilterDropdown from '@/components/admin/AdminUserFilterDropdown';
import AdminPagination from '@/components/admin/AdminPagination';

interface UserItem {
  id: string;
  name?: string | null;
  handle?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  status: string;
  createdAt: Date;
  _count?: {
    posts: number;
    comments: number;
  };
}

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [stats, setStats] = useState({
    totalUsers: 0,
    userGrowth: '+0%',
    newThisWeek: 0,
    bannedCount: 0,
  });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Tabs & Filters
  const [roleTab, setRoleTab] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');

  // Modals State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditUser, setSelectedEditUser] = useState<UserItem | null>(null);

  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<UserItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        getUserStats(),
        getAdminUsers({
          page,
          perPage: 10,
          roleFilter: roleTab,
          statusFilter,
          search,
        }),
      ]);

      setStats(statsRes);
      setUsers(usersRes.users as UserItem[]);
      setPages(usersRes.totalPages);
      setTotalCount(usersRes.totalCount);
    } catch (err) {
      console.error('Failed to load users data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, roleTab, statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = (user: UserItem) => {
    setSelectedEditUser(user);
    setEditModalOpen(true);
  };

  const handleOpenDelete = (user: UserItem) => {
    setSelectedDeleteUser(user);
    setDeleteModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}
        >
          จัดการผู้ใช้ (Manage Users)
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          ระบบจัดการและดูแลบัญชีผู้ใช้งานในระบบ Prompty
        </p>
      </div>

      {/* 3 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Card 1: ผู้ใช้ทั้งหมด */}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                ผู้ใช้ทั้งหมด
              </div>
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                }}
              >
                {stats.totalUsers.toLocaleString()}
              </div>
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
              <Users size={22} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#10b981',
              fontWeight: 600,
            }}
          >
            <TrendingUp size={14} />
            <span>{stats.userGrowth} จากเดือนที่แล้ว</span>
          </div>
        </div>

        {/* Card 2: สมัครใหม่ (สัปดาห์นี้) */}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                สมัครใหม่ (สัปดาห์นี้)
              </div>
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                }}
              >
                {stats.newThisWeek.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={22} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            <Clock size={14} />
            <span>อัปเดตล่าสุด: เมื่อกี้นี้</span>
          </div>
        </div>

        {/* Card 3: ถูกระงับบัญชี */}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                ถูกระงับบัญชี
              </div>
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 800,
                  color: '#dc2626',
                  lineHeight: 1,
                }}
              >
                {stats.bannedCount.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ban size={22} />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            <AlertCircle size={14} />
            <span>ต้องการการตรวจสอบ</span>
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
        {/* Header Bar with Role Tabs & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Role Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '4px',
              borderRadius: '9999px',
              border: '1px solid #f1f5f9',
            }}
          >
            <button
              onClick={() => {
                setRoleTab('ALL');
                setPage(1);
              }}
              style={{
                padding: '6px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: roleTab === 'ALL' ? '#ffffff' : 'transparent',
                color: roleTab === 'ALL' ? '#0f172a' : '#64748b',
                fontWeight: roleTab === 'ALL' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow:
                  roleTab === 'ALL' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => {
                setRoleTab('ADMIN');
                setPage(1);
              }}
              style={{
                padding: '6px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: roleTab === 'ADMIN' ? '#ffffff' : 'transparent',
                color: roleTab === 'ADMIN' ? '#0f172a' : '#64748b',
                fontWeight: roleTab === 'ADMIN' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow:
                  roleTab === 'ADMIN' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              ผู้ดูแลระบบ
            </button>
            <button
              onClick={() => {
                setRoleTab('USER');
                setPage(1);
              }}
              style={{
                padding: '6px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: roleTab === 'USER' ? '#ffffff' : 'transparent',
                color: roleTab === 'USER' ? '#0f172a' : '#64748b',
                fontWeight: roleTab === 'USER' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow:
                  roleTab === 'USER' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              ผู้ใช้ทั่วไป
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setAddAdminModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={15} />
              <span>เพิ่มผู้ดูแลระบบ</span>
            </button>

            <AdminUserFilterDropdown
              statusFilter={statusFilter}
              onChangeStatusFilter={(st) => {
                setStatusFilter(st);
                setPage(1);
              }}
            />
          </div>
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
                    width: '28%',
                  }}
                >
                  ผู้ใช้งาน
                </th>
                <th
                  style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    width: '32%',
                  }}
                >
                  อีเมล
                </th>
                <th
                  style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    width: '18%',
                  }}
                >
                  สิทธิ์
                </th>
                <th
                  style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    width: '12%',
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
                    width: '10%',
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
                    colSpan={5}
                    style={{
                      textAlign: 'center',
                      padding: '48px',
                      color: '#94a3b8',
                      fontSize: '14px',
                    }}
                  >
                    กำลังโหลดข้อมูลผู้ใช้...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: 'center',
                      padding: '48px',
                      color: '#94a3b8',
                      fontSize: '14px',
                    }}
                  >
                    ไม่พบข้อมูลผู้ใช้
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const handleDisplay = u.handle
                    ? `@${u.handle.replace(/^@/, '')}`
                    : `@${u.name || 'user'}`;
                  const initial = (u.name || u.handle || 'U')
                    .charAt(0)
                    .toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* ผู้ใช้งาน */}
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          {u.image ? (
                            <img
                              src={u.image}
                              alt=""
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: '#0066ff',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '14px',
                              }}
                            >
                              {initial}
                            </div>
                          )}
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#0f172a',
                            }}
                          >
                            {handleDisplay}
                          </span>
                        </div>
                      </td>

                      {/* อีเมล */}
                      <td
                        style={{
                          padding: '16px 24px',
                          color: '#334155',
                          fontSize: '14px',
                        }}
                      >
                        {u.email || '-'}
                      </td>

                      {/* สิทธิ์ */}
                      <td style={{ padding: '16px 24px' }}>
                        {u.role === 'ADMIN' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: '#f3e8ff',
                              color: '#7e22ce',
                            }}
                          >
                            ผู้ดูแลระบบ
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: '#475569',
                            }}
                          >
                            ผู้ใช้ทั่วไป
                          </span>
                        )}
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
                                u.status === 'BANNED' ? '#dc2626' : '#10b981',
                            }}
                          />
                          <span
                            style={{
                              color:
                                u.status === 'BANNED' ? '#dc2626' : '#0f172a',
                              fontWeight: 500,
                            }}
                          >
                            {u.status === 'BANNED' ? 'ถูกระงับ' : 'ปกติ'}
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
                            onClick={() => handleOpenEdit(u)}
                            title="แก้ไขข้อมูลผู้ใช้"
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
                          <button
                            onClick={() => handleOpenDelete(u)}
                            title="ลบบัญชีผู้ใช้"
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
                              e.currentTarget.style.color = '#dc2626';
                              e.currentTarget.style.background = '#fef2f2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#64748b';
                              e.currentTarget.style.background = 'none';
                            }}
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
        {!loading && users.length > 0 && (
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            perPage={10}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modals */}
      <UserEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedEditUser}
        onSuccess={loadData}
      />

      <AddAdminModal
        isOpen={addAdminModalOpen}
        onClose={() => setAddAdminModalOpen(false)}
        onSuccess={loadData}
      />

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        user={selectedDeleteUser}
        onSuccess={loadData}
      />
    </div>
  );
}

export default function AdminUsersPage() {
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
      <AdminUsersContent />
    </Suspense>
  );
}
