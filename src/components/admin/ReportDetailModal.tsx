'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { getAdminReportDetail, adminResolveReport, adminDismissReport } from '@/lib/actions/admin';

interface ReportDetailModalProps {
  postId: string;
  onClose: () => void;
  onActionComplete?: () => void;
}

export default function ReportDetailModal({ postId, onClose, onActionComplete }: ReportDetailModalProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const data = await getAdminReportDetail(postId);
        setDetail(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [postId]);

  const handleDeletePost = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้ตามที่ได้รับรายงาน?')) {
      setSubmitting(true);
      await adminResolveReport(postId);
      onActionComplete?.();
      onClose();
    }
  };

  const handleDismissReport = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการละเว้นการรายงานนี้ (ยืนยันว่าโพสต์ปลอดภัย)?')) {
      setSubmitting(true);
      await adminDismissReport(postId);
      onActionComplete?.();
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-container" style={{ padding: '40px', textAlign: 'center' }}>
          กำลังโหลดรายละเอียดรายงาน...
        </div>
      </div>
    );
  }

  if (!detail || !detail.post) {
    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-container" style={{ padding: '40px', textAlign: 'center' }}>
          ไม่พบข้อมูลโพสต์ที่ถูกรายงาน
          <button className="btn" style={{ marginTop: '16px' }} onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    );
  }

  const { post, reasons, reportCount } = detail;
  const formattedDate = new Date(post.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>รายละเอียดการรายงาน</span>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body">
          {/* ฝั่งซ้าย: เนื้อหาโพสต์ + Warning */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' }}>
              {post.title}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              👤 @{post.author.handle || post.author.name} • วันที่ {formattedDate}
            </div>

            {/* Warning Box */}
            <div className="admin-report-warning-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
                <AlertTriangle size={18} />
                <span>Warning: Suspicious Content</span>
              </div>
              <div>โพสต์นี้ถูกรายงานว่าอาจเป็นมัลแวร์หรือมีลิงก์อันตรายแอบแฝง</div>
            </div>

            {/* Label */}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Reported {post.type === 'CODE' ? 'Code Snippet' : 'Prompt Text'}
            </span>

            {/* Content Box */}
            {post.content && (
              <div
                style={{
                  background: 'var(--bg-code)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: '#f8fafc',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {post.content}
              </div>
            )}
          </div>

          {/* ฝั่งขวา: สรุปการรายงาน + ปุ่มแอ็กชัน */}
          <div className="admin-modal-right-box" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertTriangle size={20} color="var(--error)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  รายละเอียดการรายงาน
                </h3>
              </div>

              {/* สาเหตุ */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  สาเหตุ (Reason)
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {reasons.map((r: string) => (
                    <span key={r} className="admin-reason-badge">
                      🚨 {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* จำนวนรายงาน */}
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  จำนวนการรายงาน (Reports)
                </span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {reportCount} <span style={{ fontSize: '14px', fontWeight: 500 }}>ครั้ง</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              <button
                className="admin-btn-delete-full"
                onClick={handleDeletePost}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Trash2 size={16} />
                <span>ลบโพสต์นี้ (Delete Post)</span>
              </button>

              <button
                className="admin-btn-dismiss-full"
                onClick={handleDismissReport}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CheckCircle2 size={16} />
                <span>ละเว้น (โพสต์ปลอดภัย)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
