'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { updateUserRoleAndStatus } from '@/lib/actions/admin';

interface UserData {
  id: string;
  name?: string | null;
  handle?: string | null;
  email?: string | null;
  image?: string | null;
  role: 'ADMIN' | 'USER' | string;
  status: 'ACTIVE' | 'BANNED' | string;
}

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onSuccess: () => void;
}

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserEditModalProps) {
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [status, setStatus] = useState<'ACTIVE' | 'BANNED'>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setRole(user.role === 'ADMIN' ? 'ADMIN' : 'USER');
      setStatus(user.status === 'BANNED' ? 'BANNED' : 'ACTIVE');
      setError('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await updateUserRoleAndStatus(user.id, { role, status });
      if (!res.success) {
        setError(res.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
        setLoading(false);
        return;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleDisplay = user.handle ? `@${user.handle.replace(/^@/, '')}` : `@${user.name || 'user'}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
            }}
          >
            แก้ไขข้อมูลผู้ใช้งาน
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            {/* User Profile Summary Box */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '20px',
                border: '1px solid #f1f5f9',
              }}
            >
              <img
                src={
                  user.image ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                }
                alt=""
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {handleDisplay}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {user.email || 'ไม่มีอีเมล'}
                </div>
              </div>
            </div>

            {/* Field 1: สิทธิ์การใช้งาน */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '10px',
                }}
              >
                สิทธิ์การใช้งาน
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                {/* User Card */}
                <div
                  onClick={() => setRole('USER')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border:
                      role === 'USER'
                        ? '2px solid #0066ff'
                        : '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border:
                        role === 'USER'
                          ? '5px solid #0066ff'
                          : '2px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: role === 'USER' ? '#0066ff' : '#334155',
                    }}
                  >
                    ผู้ใช้ทั่วไป (User)
                  </span>
                </div>

                {/* Admin Card */}
                <div
                  onClick={() => setRole('ADMIN')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border:
                      role === 'ADMIN'
                        ? '2px solid #0066ff'
                        : '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border:
                        role === 'ADMIN'
                          ? '5px solid #0066ff'
                          : '2px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: role === 'ADMIN' ? '#0066ff' : '#334155',
                    }}
                  >
                    ผู้ดูแลระบบ (Admin)
                  </span>
                </div>
              </div>
            </div>

            {/* Field 2: สถานะบัญชี */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '10px',
                }}
              >
                สถานะบัญชี
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                {/* Active Card */}
                <div
                  onClick={() => setStatus('ACTIVE')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border:
                      status === 'ACTIVE'
                        ? '2px solid #0066ff'
                        : '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border:
                        status === 'ACTIVE'
                          ? '5px solid #0066ff'
                          : '2px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: status === 'ACTIVE' ? '#0066ff' : '#334155',
                    }}
                  >
                    ปกติ (Active)
                  </span>
                </div>

                {/* Banned Card */}
                <div
                  onClick={() => setStatus('BANNED')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border:
                      status === 'BANNED'
                        ? '2px solid #dc2626'
                        : '1px solid #e2e8f0',
                    background: status === 'BANNED' ? '#fff5f5' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border:
                        status === 'BANNED'
                          ? '5px solid #dc2626'
                          : '2px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: status === 'BANNED' ? '#dc2626' : '#334155',
                    }}
                  >
                    ระงับการใช้งาน (Banned)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              background: '#f8fafc',
              borderTop: '1px solid #f1f5f9',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px 16px',
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#0066ff',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)',
              }}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
