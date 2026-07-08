'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PromptyLogo from '@/components/shared/PromptyLogo';
import { verifyOtp, sendOtp } from '@/lib/actions/auth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'user@gmail.com';
  const flow = searchParams.get('flow'); // 'reset' = forgot-password flow

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(59);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        const chars = value.slice(0, 6).split('');
        const newOtp = [...otp];
        chars.forEach((char, i) => {
          if (index + i < 6) newOtp[index + i] = char;
        });
        setOtp(newOtp);
        const nextIndex = Math.min(index + chars.length, 5);
        inputRefs.current[nextIndex]?.focus();
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await verifyOtp(email, code);

      if (!result.success) {
        setError(result.error || 'รหัส OTP ไม่ถูกต้อง');
        return;
      }

      if (flow === 'reset') {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        router.push('/register/success');
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(59);
    setError('');
    const purpose = flow === 'reset' ? 'reset' : 'register';
    await sendOtp(email, purpose);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
        <h1 className="auth-title">ยืนยันอีเมลของคุณ</h1>
        <p className="auth-subtitle">
          เราได้ส่งรหัส 6 หลักไปที่ {email} แล้ว
        </p>

        {/* OTP Inputs */}
        <div className="otp-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="otp-input"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: 'var(--error)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
            {error}
          </p>
        )}

        {/* Verify button */}
        <button
          className="btn btn-primary btn-full"
          onClick={handleVerify}
          disabled={otp.join('').length !== 6 || isLoading}
        >
          {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส'}
        </button>

        {/* Resend */}
        <p className="resend-text" style={{ marginTop: '20px' }}>
          ยังไม่ได้รับรหัส?{' '}
          {countdown > 0 ? (
            <span>
              <a style={{ cursor: 'default', opacity: 0.5 }}>ส่งอีกครั้ง</a>{' '}
              ({formatTime(countdown)})
            </span>
          ) : (
            <a onClick={handleResend} style={{ cursor: 'pointer' }}>ส่งอีกครั้ง</a>
          )}
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
