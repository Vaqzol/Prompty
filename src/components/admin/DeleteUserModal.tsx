'use client';

import { useState, useEffect } from 'react';
import { UserMinus } from 'lucide-react';
import { deleteUserAccount } from '@/lib/actions/admin';

interface UserData {
  id: string;
  name?: string | null;
  handle?: string | null;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onSuccess: () => void;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: DeleteUserModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleDisplay = user.handle
    ? `@${user.handle.replace(/^@/, '')}`
    : `@${user.name || 'user'}`;

  const handleDelete = async () => {
    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      const res = await deleteUserAccount(user.id);
      if (!res.success) {
        setError(res.error || 'เกิดข้อผิดพลาดในการลบบัญชี');
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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          padding: '32px 28px',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circle Icon Badge */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <UserMinus size={28} />
        </div>

        {/* Title & Warning */}
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 12px 0',
          }}
        >
          ยืนยันการลบบัญชี {handleDisplay}?
        </h2>

        <p
          style={{
            fontSize: '13.5px',
            color: '#64748b',
            lineHeight: 1.55,
            margin: '0 0 20px 0',
          }}
        >
          คุณกำลังจะลบบัญชีผู้ใช้งานนี้ออกจากระบบอย่างถาวร ข้อมูลส่วนตัว โพสต์
          และความคิดเห็นทั้งหมดของผู้ใช้นี้จะถูกลบออกไปด้วย
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>

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
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        {/* Checkbox Box */}
        <div
          onClick={() => setConfirmed(!confirmed)}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: '#0066ff',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            ฉันเข้าใจว่าข้อมูลทั้งหมดจะถูกลบอย่างถาวร
          </span>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '9999px',
              border: 'none',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!confirmed || loading}
            style={{
              padding: '12px',
              borderRadius: '9999px',
              border: 'none',
              background: confirmed ? '#e11d48' : '#fca5a5',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: confirmed && !loading ? 'pointer' : 'not-allowed',
              boxShadow: confirmed ? '0 4px 12px rgba(225, 29, 72, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'กำลังลบ...' : 'ลบบัญชีผู้ใช้'}
          </button>
        </div>
      </div>
    </div>
  );
}
