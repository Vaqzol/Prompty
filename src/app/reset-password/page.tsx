'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import PromptyLogo from '@/components/shared/PromptyLogo';
import { Suspense } from 'react';
import { resetPassword } from '@/lib/actions/auth';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณากรอกใหม่อีกครั้ง');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email, password);

      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาด');
        return;
      }

      router.push('/reset-password/success');
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
        <h1 className="auth-title">ตั้งรหัสผ่านใหม่</h1>
        <p className="auth-subtitle">
          กรอกรหัสผ่านใหม่และยืนยันรหัสผ่านใหม่ของคุณ
        </p>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="form-group">
            <label className="form-label">รหัสผ่านใหม่</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field has-icon-right"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field has-icon-right"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p style={{
              color: 'var(--error)',
              fontSize: '13px',
              marginBottom: '12px',
              textAlign: 'center',
            }}>
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
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <PromptyLogo size={48} />
            <span>Prompty</span>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>กำลังโหลด...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
