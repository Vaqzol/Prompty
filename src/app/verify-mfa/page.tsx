'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PromptyLogo from '@/components/shared/PromptyLogo';

export default function VerifyMfaPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [code, setCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isBackupMode]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Hard refresh to reload session with new cookie
        window.location.href = '/';
      } else {
        setError(data.error || 'รหัสไม่ถูกต้อง กรุณาลองใหม่');
        setCode('');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in" style={{ maxWidth: '420px' }}>
        {/* Logo */}
        <div className="auth-logo">
          <PromptyLogo size={48} />
          <span>Prompty</span>
        </div>

        {/* Shield Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(37,99,235,0.1)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '4px auto 16px',
        }}>
          <Shield size={28} />
        </div>

        <h1 className="auth-title" style={{ marginBottom: '6px' }}>
          ยืนยันตัวตน 2 ชั้น
        </h1>
        <p className="auth-subtitle" style={{ marginBottom: '28px' }}>
          {isBackupMode
            ? 'กรอก Backup Code ที่คุณบันทึกไว้'
            : 'เปิดแอป Google Authenticator แล้วกรอกรหัส 6 หลัก'}
        </p>

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label">
              {isBackupMode ? 'Backup Code' : 'รหัส OTP (6 หลัก)'}
            </label>
            <input
              ref={inputRef}
              type="text"
              className="input-field"
              placeholder={isBackupMode ? 'XXXXXXXX' : '000000'}
              value={code}
              onChange={(e) => {
                const val = isBackupMode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/\D/g, '');
                if (!isBackupMode && val.length > 6) return;
                setCode(val);
              }}
              maxLength={isBackupMode ? 20 : 6}
              style={{
                textAlign: 'center',
                fontSize: '26px',
                letterSpacing: isBackupMode ? '0.12em' : '0.45em',
                fontWeight: 700,
                height: '60px',
              }}
              autoComplete="one-time-code"
              inputMode={isBackupMode ? 'text' : 'numeric'}
              autoFocus
            />
          </div>

          {error && (
            <p style={{
              color: 'var(--error)', fontSize: '13px',
              textAlign: 'center', marginBottom: '12px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !code.trim() || (!isBackupMode && code.length < 6)}
            style={{ marginTop: '4px', height: '48px' }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                ยืนยัน <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Toggle backup mode */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            className="btn-text"
            onClick={() => { setIsBackupMode(!isBackupMode); setCode(''); setError(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={13} />
            {isBackupMode ? 'ใช้รหัส OTP จากแอป' : 'ใช้ Backup Code แทน'}
          </button>
        </div>

        {/* Help box */}
        <div style={{
          marginTop: '20px', padding: '12px 16px', borderRadius: '10px',
          background: 'var(--bg-secondary)', fontSize: '12px', color: 'var(--text-secondary)',
          display: 'flex', gap: '8px', alignItems: 'flex-start',
        }}>
          <KeyRound size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
          <span>
            หากคุณไม่มีอุปกรณ์ที่ใช้ Authenticator กรุณาใช้ Backup Code
            ที่บันทึกไว้ตอนตั้งค่า 2FA — แต่ละ code ใช้ได้ครั้งเดียวเท่านั้น
          </span>
        </div>
      </div>
    </div>
  );
}
