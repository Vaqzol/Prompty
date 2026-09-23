'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import PromptyLogo from '@/components/shared/PromptyLogo';
import { authenticate } from '@/lib/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const displayedError = error || (searchParams.get('error') === 'banned' ? 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' : '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // ตรวจสอบความถูกต้องของอีเมลและรหัสผ่านก่อนเพื่อดึงข้อความ Error ที่ถูกต้อง
      const authCheck = await authenticate({ email, password });
      if (authCheck.error) {
        setError(authCheck.error);
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        return;
      }

      router.push('/');
      router.refresh();
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
          <h1 className="auth-title">ยินดีต้อนรับกลับ!</h1>
          <p className="auth-subtitle">เข้าสู่ระบบเพื่อใช้งาน Prompty</p>

          <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">อีเมล</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="login-email"
                required
                autoComplete="email"
                type="email"
                className="input-field has-icon-left"
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">รหัสผ่าน</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                required
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field has-icon-left has-icon-right"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <Link href="/forgot-password" className="form-link-right">ลืมรหัสผ่าน?</Link>
          </div>

          {/* Error */}
          {displayedError && (
            <p style={{ color: 'var(--error)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
              {displayedError}
            </p>
          )}

          {/* Submit */}
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: '8px' }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          </form>
          {/* Footer */}
          <div className="auth-footer">
            ยังไม่มีบัญชี ?
            <Link href="/register">สร้างบัญชีใหม่</Link>
          </div>
        </div>
      </div>
  );
}
