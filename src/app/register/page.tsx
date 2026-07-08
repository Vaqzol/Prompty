'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import PromptyLogo from '@/components/shared/PromptyLogo';
import { registerUser } from '@/lib/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({
        name: form.username,
        email: form.email,
        password: form.password,
      });

      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    form.username &&
    form.email &&
    form.password &&
    form.confirmPassword &&
    acceptTerms;

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <PromptyLogo size={48} />
          <span>Prompty</span>
        </div>

        {/* Heading */}
        <h1 className="auth-title">สร้างบัญชีใหม่</h1>
        <p className="auth-subtitle">เข้าสู่ระบบเพื่อใช้งาน Prompty</p>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label">ชื่อผู้ใช้งาน</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                placeholder="Yorna"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="input-field"
                placeholder="Yorna67@gmail.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">รหัสผ่าน</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field has-icon-right"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">ยืนยันรหัสผ่าน</label>
            <div className="input-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input-field has-icon-right"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="accept-terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="accept-terms">
              ฉันยอมรับ <a href="#">ข้อตกลงการใช้งาน</a> และ{' '}
              <a href="#">นโยบายความเป็นส่วนตัว</a>
            </label>
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          มีบัญชีอยู่แล้ว?
          <Link href="/login">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}
