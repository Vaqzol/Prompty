'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { createAdminTag, updateAdminTag } from '@/lib/actions/admin';

interface TagData {
  id?: string;
  name: string;
  status: 'VISIBLE' | 'HIDDEN';
}

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: TagData | null;
  onSuccess: () => void;
}

export default function TagModal({
  isOpen,
  onClose,
  tag,
  onSuccess,
}: TagModalProps) {
  const isEdit = !!tag?.id;

  const [tagName, setTagName] = useState('');
  const [status, setStatus] = useState<'VISIBLE' | 'HIDDEN'>('VISIBLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (tag) {
        setTagName(tag.name.startsWith('#') ? tag.name : `#${tag.name}`);
        setStatus(tag.status || 'VISIBLE');
      } else {
        setTagName('');
        setStatus('VISIBLE');
      }
      setError('');
    }
  }, [isOpen, tag]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tagName.trim().replace(/^#/, '');
    if (!clean) {
      setError('กรุณากรอกชื่อแท็ก');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit && tag?.id) {
        const res = await updateAdminTag(tag.id, {
          name: clean,
          status,
        });
        if (!res.success) {
          setError(res.error || 'เกิดข้อผิดพลาดในการแก้ไขแท็ก');
          setLoading(false);
          return;
        }
      } else {
        const res = await createAdminTag({
          name: clean,
          status,
        });
        if (!res.success) {
          setError(res.error || 'เกิดข้อผิดพลาดในการสร้างแท็ก');
          setLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

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
            {isEdit ? 'แก้ไขแท็ก' : 'สร้างแท็กใหม่'}
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

            {/* Field 1: ชื่อแท็ก */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                ชื่อแท็ก
              </label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="#React"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>

            {/* Field 2: สถานะการแสดงผล */}
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
                สถานะการแสดงผล
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                {/* Option 1: แสดงผล */}
                <div
                  onClick={() => setStatus('VISIBLE')}
                  style={{
                    position: 'relative',
                    padding: '16px',
                    borderRadius: '12px',
                    border:
                      status === 'VISIBLE'
                        ? '2px solid #0066ff'
                        : '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: status === 'VISIBLE' ? '#0066ff' : '#1e293b',
                      }}
                    >
                      แสดงผล
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      paddingLeft: '16px',
                    }}
                  >
                    (Visible)
                  </div>

                  {status === 'VISIBLE' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#0066ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Option 2: ซ่อน */}
                <div
                  onClick={() => setStatus('HIDDEN')}
                  style={{
                    position: 'relative',
                    padding: '16px',
                    borderRadius: '12px',
                    border:
                      status === 'HIDDEN'
                        ? '2px solid #0066ff'
                        : '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#94a3b8',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: status === 'HIDDEN' ? '#0066ff' : '#1e293b',
                      }}
                    >
                      ซ่อน
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      paddingLeft: '16px',
                    }}
                  >
                    (Hidden)
                  </div>

                  {status === 'HIDDEN' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#0066ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
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
