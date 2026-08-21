'use client';

import { useState, useEffect } from 'react';
import { Shield, QrCode, Copy, Download, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getMfaStatus, initMfaSetup, confirmEnableMfa, disableMfa } from '@/lib/actions/mfa';
import Image from 'next/image';

type MfaStatus = { enabled: boolean; hasBackupCodes: boolean };
type SetupStep = 'idle' | 'qr' | 'verify' | 'backup-codes' | 'disable';

export default function SecuritySettings() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [step, setStep] = useState<SetupStep>('idle');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Setup state
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Disable MFA state
  const [disablePassword, setDisablePassword] = useState('');
  const [disableOtp, setDisableOtp] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);

  useEffect(() => {
    getMfaStatus().then((s) => { setStatus(s); setPageLoading(false); });
  }, []);

  const resetState = () => {
    setStep('idle');
    setError('');
    setSuccess('');
    setOtpInput('');
    setQrCodeUrl('');
    setTempSecret('');
    setBackupCodes([]);
    setDisablePassword('');
    setDisableOtp('');
  };

  // ── เริ่ม Setup MFA ──
  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    const res = await initMfaSetup();
    if (res.success && res.qrCodeUrl && res.secret) {
      setQrCodeUrl(res.qrCodeUrl);
      setTempSecret(res.secret);
      setStep('qr');
    } else {
      setError(res.error || 'เกิดข้อผิดพลาด');
    }
    setLoading(false);
  };

  // ── ยืนยัน OTP เพื่อเปิด MFA ──
  const handleConfirmEnable = async () => {
    if (!otpInput.trim()) return;
    setLoading(true);
    setError('');
    const res = await confirmEnableMfa(tempSecret, otpInput.trim());
    if (res.success && res.backupCodes) {
      setBackupCodes(res.backupCodes);
      setStatus({ enabled: true, hasBackupCodes: true });
      setStep('backup-codes');
    } else {
      setError(res.error || 'รหัส OTP ไม่ถูกต้อง');
    }
    setLoading(false);
  };

  // ── ปิด MFA ──
  const handleDisable = async () => {
    if (!disablePassword.trim() || !disableOtp.trim()) return;
    setLoading(true);
    setError('');
    const res = await disableMfa(disablePassword.trim(), disableOtp.trim());
    if (res.success) {
      setStatus({ enabled: false, hasBackupCodes: false });
      setSuccess('ปิดการยืนยันตัวตน 2 ชั้นเรียบร้อยแล้ว');
      resetState();
    } else {
      setError(res.error || 'เกิดข้อผิดพลาด');
    }
    setLoading(false);
  };

  // ── Copy backup codes ──
  const handleCopyBackup = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleDownloadBackup = () => {
    const content = `Prompty - Backup Codes (เก็บไว้ในที่ปลอดภัย)\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nหมายเหตุ: แต่ละ code ใช้ได้ครั้งเดียวเท่านั้น`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompty-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="settings-title">ความปลอดภัย</h1>
      <p className="settings-desc">จัดการการยืนยันตัวตนและความปลอดภัยของบัญชี</p>

      {/* ── MFA Status Card ── */}
      <div className="settings-form" style={{ marginTop: '24px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: status?.enabled ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: status?.enabled ? '#22c55e' : 'var(--text-tertiary)',
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                  การยืนยันตัวตน 2 ชั้น (2FA)
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                  background: status?.enabled ? 'rgba(34,197,94,0.15)' : 'var(--bg-secondary)',
                  color: status?.enabled ? '#22c55e' : 'var(--text-tertiary)',
                  border: `1px solid ${status?.enabled ? 'rgba(34,197,94,0.3)' : 'var(--border-default)'}`,
                }}>
                  {status?.enabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                {status?.enabled
                  ? 'บัญชีของคุณได้รับการป้องกันด้วย Google Authenticator'
                  : 'เพิ่มชั้นความปลอดภัยด้วยรหัส OTP จาก Google Authenticator'}
              </p>
            </div>
          </div>

          {step === 'idle' && (
            <button
              className={status?.enabled ? 'btn-secondary' : 'btn-primary'}
              onClick={() => status?.enabled ? setStep('disable') : handleStartSetup()}
              disabled={loading}
              style={{ flexShrink: 0, fontSize: '13px' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : (
                status?.enabled ? 'ปิดใช้งาน 2FA' : '🔐 เปิดใช้ 2FA'
              )}
            </button>
          )}
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontSize: '13px', display: 'flex', gap: '8px' }}>
            <XCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '13px', display: 'flex', gap: '8px' }}>
            <CheckCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> {success}
          </div>
        )}

        {/* ── Step: QR Code ── */}
        {step === 'qr' && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-default)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>ขั้นตอนที่ 1: สแกน QR Code</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              เปิดแอป <strong>Google Authenticator</strong> หรือ <strong>Microsoft Authenticator</strong> แล้วสแกน QR Code ด้านล่าง
            </p>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid var(--border-default)', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="MFA QR Code" width={180} height={180} style={{ display: 'block' }} />
              </div>
            </div>

            {/* Manual entry */}
            <details style={{ marginBottom: '20px' }}>
              <summary style={{ fontSize: '12px', color: 'var(--text-tertiary)', cursor: 'pointer', userSelect: 'none' }}>
                สแกน QR ไม่ได้? กรอก Key ด้วยตนเอง
              </summary>
              <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                {tempSecret}
              </div>
            </details>

            <button
              className="btn btn-primary btn-full"
              onClick={() => { setStep('verify'); setOtpInput(''); }}
            >
              สแกนเสร็จแล้ว → ไปขั้นตอนถัดไป
            </button>
            <button className="btn-text" style={{ marginTop: '10px', width: '100%', textAlign: 'center' }} onClick={resetState}>ยกเลิก</button>
          </div>
        )}

        {/* ── Step: Verify OTP ── */}
        {step === 'verify' && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-default)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>ขั้นตอนที่ 2: ยืนยันรหัส OTP</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              กรอกรหัส 6 หลักที่แสดงในแอป Authenticator เพื่อยืนยัน
            </p>

            <div className="settings-field">
              <input
                type="text"
                inputMode="numeric"
                placeholder="000 000"
                value={otpInput}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 6) setOtpInput(v); }}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '0.4em', fontWeight: 700 }}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleConfirmEnable}
              disabled={loading || otpInput.length < 6}
              style={{ marginTop: '12px' }}
            >
              {loading ? 'กำลังยืนยัน...' : '✅ ยืนยันและเปิดใช้ 2FA'}
            </button>
            <button className="btn-text" style={{ marginTop: '10px', width: '100%', textAlign: 'center' }} onClick={() => setStep('qr')}>← ย้อนกลับ</button>
          </div>
        )}

        {/* ── Step: Backup Codes ── */}
        {step === 'backup-codes' && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-default)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <CheckCircle size={18} color="#22c55e" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#22c55e' }}>เปิดใช้ 2FA สำเร็จ!</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <strong>บันทึก Backup Codes เหล่านี้ไว้ในที่ปลอดภัย!</strong> ใช้แทน OTP ได้ในกรณีฉุกเฉิน โดยแต่ละ code ใช้ได้ครั้งเดียวเท่านั้น
            </p>

            {/* Backup codes grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
              padding: '16px', borderRadius: '10px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)', marginBottom: '14px',
            }}>
              {backupCodes.map((code, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)' }}>
                  {i + 1}. {code}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleCopyBackup}>
                {copiedBackup ? <><CheckCircle size={14} />คัดลอกแล้ว!</> : <><Copy size={14} />คัดลอก</>}
              </button>
              <button className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={handleDownloadBackup}>
                <Download size={14} />ดาวน์โหลด
              </button>
            </div>

            <button className="btn btn-primary btn-full" onClick={resetState}>
              เสร็จสิ้น — เริ่มใช้งาน 2FA
            </button>
          </div>
        )}

        {/* ── Step: Disable MFA ── */}
        {step === 'disable' && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-default)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: 'var(--error)' }}>ปิดการยืนยันตัวตน 2 ชั้น</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              ต้องยืนยันทั้งรหัสผ่านและรหัส OTP จากแอป Authenticator
            </p>

            <div className="settings-field">
              <label>รหัสผ่าน</label>
              <div className="settings-input-password">
                <input
                  type={showDisablePassword ? 'text' : 'password'}
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                />
                <button className="btn-icon-inline" onClick={() => setShowDisablePassword(!showDisablePassword)}>
                  {showDisablePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="settings-field" style={{ marginTop: '12px' }}>
              <label>รหัส OTP จากแอป Authenticator</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000 000"
                value={disableOtp}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 6) setDisableOtp(v); }}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.3em', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn-danger"
                onClick={handleDisable}
                disabled={loading || !disablePassword || disableOtp.length < 6}
                style={{ flex: 1 }}
              >
                {loading ? 'กำลังดำเนินการ...' : '⚠️ ปิด 2FA'}
              </button>
              <button className="btn-secondary" onClick={resetState} style={{ flex: 1 }}>ยกเลิก</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
