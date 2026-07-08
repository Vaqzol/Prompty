'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import PromptyLogo from '@/components/shared/PromptyLogo';
import { forgotPassword } from '@/lib/actions/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await forgotPassword(email);
      // ไปหน้า OTP เสมอ (ไม่บอกว่าอีเมลมีหรือเปล่าเพื่อความปลอดภัย)
      router.push(`/verify-email?email=${encodeURIComponent(email)}&flow=reset`);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <PromptyLogo size={48} />
          <span>Prompty</span>
        </div>

        {/* Heading */}
        <h1 className="auth-title">ลืมรหัสผ่านใช่ไหม?</h1>
        <p className="auth-subtitle">
          กรุณากรอกอีเมลที่คุณใช้สมัครบัญชี เราจะส่ง OTP สำหรับ
          <br />
          ตั้งค่ารหัสผ่านใหม่ไปให้
        </p>

        {/* Email */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                type="email"
                className="input-field has-icon-left"
                placeholder="Yorna67@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: '8px' }}
            disabled={isLoading}
          >
            {isLoading ? 'กำลังส่งอีเมล...' : 'ยืนยันอีเมล'}
          </button>
        </form>

        {/* Back to login */}
        <div className="auth-footer">
          <Link href="/login" style={{ color: 'var(--brand-primary)' }}>
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
