'use client';

import { Trash2, Check } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  variant?: 'delete' | 'safe';
  title?: string;
  description?: string;
  confirmText?: string;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  variant = 'delete',
  title,
  description,
  confirmText,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const isDelete = variant === 'delete';

  const defaultTitle = isDelete
    ? 'ยืนยันการลบโพสต์?'
    : 'ยืนยันว่าโพสต์นี้ปลอดภัย?';

  const defaultDescription = isDelete
    ? 'คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้ และข้อมูลจะถูกลบออกจากระบบอย่างถาวร'
    : 'โพสต์นี้จะถูกลบออกจากรายการ \'รายงานปัญหา\' แต่จะยังคงแสดงผลให้ผู้ใช้งานทั่วไปเห็นบนหน้าฟีดตามปกติ';

  const defaultConfirmText = isDelete ? 'ลบข้อมูล' : 'ยืนยันความปลอดภัย';

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
          maxWidth: '420px',
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
            background: isDelete ? '#fef2f2' : '#ecfdf5',
            color: isDelete ? '#dc2626' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          {isDelete ? <Trash2 size={26} /> : <Check size={28} />}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '19px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 12px 0',
          }}
        >
          {title || defaultTitle}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '13.5px',
            color: '#64748b',
            lineHeight: 1.55,
            margin: '0 0 28px 0',
          }}
        >
          {description || defaultDescription}
        </p>

        {/* Action Buttons */}
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
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '9999px',
              border: 'none',
              background: isDelete ? '#bb1f1f' : '#10b981',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: isDelete
                ? '0 4px 12px rgba(187, 31, 31, 0.25)'
                : '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'กำลังดำเนินการ...' : confirmText || defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
