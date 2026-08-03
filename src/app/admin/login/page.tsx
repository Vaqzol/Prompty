'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import PromptyLogo from '@/components/shared/PromptyLogo';
import { adminAuthenticate } from '@/lib/actions/admin';
import '@/app/admin/admin.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. ตรวจสอบ Credentials + Admin Role ผ่าน Server Action
      const checkResult = await adminAuthenticate({ email, password });
      if (checkResult.error) {
        setError(checkResult.error);
        setIsLoading(false);
        return;
      }

      // 2. ล็อกอินด้วย NextAuth
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        setIsLoading(false);
        return;
      }

      // 3. Redirect ไปยัง Admin Dashboard
      router.push('/admin');
      router.refresh();
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#111827', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Strip */}
      <div style={{ padding: '12px 24px', color: '#9ca3af', fontSize: '13px', fontWeight: 500 }}>
        เข้าสู่ระบบ Admin
      </div>

      {/* Main Form Center Box */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '40px 36px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            color: '#1f2937',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
            <PromptyLogo size={36} />
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#000000' }}>Prompty</span>
          </div>

          {/* Titles */}
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px', color: '#111827' }}>
            ระบบจัดการหลังบ้าน
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
            กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                อีเมล
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    color: '#111827',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                รหัสผ่าน
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    color: '#111827',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            {/* Submit Pill Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '180px',
                padding: '12px 24px',
                borderRadius: '9999px',
                border: 'none',
                background: '#0052cc',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)',
                margin: '0 auto',
                display: 'block',
              }}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
