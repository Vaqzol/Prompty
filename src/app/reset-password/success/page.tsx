'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import PromptyLogo from '@/components/shared/PromptyLogo';

export default function ResetPasswordSuccessPage() {
  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in" style={{ maxWidth: '400px' }}>
        {/* Logo */}
        <div className="auth-logo">
          <PromptyLogo size={48} />
          <span>Prompty</span>
        </div>

        {/* Success icon */}
        <div className="success-icon animate-scale-in">
          <CheckCircle2 size={40} />
        </div>

        {/* Heading */}
        <h1 className="auth-title">เปลี่ยนรหัสผ่านสำเร็จ!</h1>
        <p className="auth-subtitle" style={{ marginBottom: '28px' }}>
          รหัสผ่านของคุณได้รับการอัปเดตแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
        </p>

        {/* CTA */}
        <Link href="/login" className="btn btn-primary" style={{ padding: '0 32px' }}>
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
