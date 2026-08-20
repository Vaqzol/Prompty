'use client';

import Link from 'next/link';
import { Wrench, Shield, ArrowRight } from 'lucide-react';
import PromptyLogo from '@/components/shared/PromptyLogo';

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '24px',
        fontFamily: 'var(--font-inter), var(--font-ibm-plex-sans-thai), sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '24px',
          padding: '48px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <PromptyLogo size={56} />
        </div>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.1)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <Wrench size={32} />
        </div>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}
        >
          ระบบกำลังปิดปรับปรุงชั่วคราว
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          ขออภัยในความไม่สะดวก ขณะนี้ทีมงานกำลังดำเนินการอัปเดตและบำรุงรักษาระบบ Prompty เพื่อประสิทธิภาพการใช้งานที่ดียิ่งขึ้น กรุณากลับมาใหม่อีกครั้งในภายหลัง
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderTop: '1px solid var(--border-default)',
            paddingTop: '24px',
          }}
        >
          <Link
            href="/admin/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              border: '1px solid var(--border-default)',
              transition: 'all 0.2s',
            }}
          >
            <Shield size={16} />
            เข้าสู่ระบบสำหรับผู้ดูแลระบบ (Admin)
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
