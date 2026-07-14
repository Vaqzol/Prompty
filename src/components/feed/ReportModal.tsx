'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createReport } from '@/lib/actions/report';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const REPORT_REASONS = [
  'สแปม หรือ โฆษณาแอบแฝง',
  'เนื้อหาไม่เหมาะสม หรือ รุนแรง',
  'มีโค้ดที่เป็นอันตราย หรือ มัลแวร์',
  'ละเมิดลิขสิทธิ์ หรือ แอบอ้างผลงาน',
  'อื่นๆ',
];

export default function ReportModal({ isOpen, onClose, postId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    const result = await createReport(postId, selectedReason);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedReason(REPORT_REASONS[0]);
      }, 2000);
    } else {
      setError(result.error || 'เกิดข้อผิดพลาดในการรายงาน');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">รายงานโพสต์</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content" style={{ padding: '20px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#10B981' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <p>ส่งรายงานสำเร็จ ขอบคุณที่ช่วยดูแลชุมชนของเรา</p>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '16px', color: '#6B7280', fontSize: '14px' }}>
                ทำไมคุณถึงต้องการรายงานโพสต์นี้?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {REPORT_REASONS.map((reason) => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#3B82F6',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ color: '#E5E7EB', fontSize: '15px' }}>{reason}</span>
                  </label>
                ))}
              </div>

              {error && <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={onClose}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: 'transparent', 
                    color: '#9CA3AF',
                    cursor: 'pointer' 
                  }}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleSubmit}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#DC2626', 
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
