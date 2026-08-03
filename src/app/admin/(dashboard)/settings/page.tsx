import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, Mail, User, Server } from 'lucide-react';

export default async function AdminSettingsPage() {
  const session = await auth();

  let adminUser = null;
  if (session?.user?.id) {
    adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, handle: true, role: true, createdAt: true },
    });
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">ตั้งค่าระบบผู้ดูแล (Admin System Settings)</h1>
        <p className="admin-page-desc">จัดการข้อมูลบัญชีผู้ดูแลระบบและตั้งค่าแพลตฟอร์ม Prompty</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>
        {/* Admin Account Info Card */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-default)' }}>
            <ShieldCheck size={22} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              ข้อมูลบัญชีผู้ดูแลระบบ (Admin Profile)
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={18} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>ชื่อผู้ดูแลระบบ</span>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{adminUser?.name || 'Admin User'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={18} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>อีเมล</span>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{adminUser?.email || '-'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--text-muted)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>สิทธิ์เข้าถึง (Role)</span>
                <span className="admin-type-badge code" style={{ marginTop: '2px', fontWeight: 700 }}>
                  {adminUser?.role || 'ADMIN'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Info & Server Status */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-default)' }}>
            <Server size={22} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              สถานะระบบ (System Environment)
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>สภาพแวดล้อม:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>Next.js 15 App Router</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>ฐานข้อมูล:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>PostgreSQL (Prisma ORM)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>โหมดแสดงผล Admin:</span>{' '}
              <strong style={{ color: 'var(--brand-primary)' }}>Fixed Design (Light Mode)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>เวอร์ชัน:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>v1.0.0</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
