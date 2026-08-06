'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { changePassword, deleteAccount } from '@/lib/actions/user';
import { signOut } from 'next-auth/react';

interface SettingsData {
  email: string | null;
  hasPassword: boolean;
  isOAuth: boolean;
}

export default function AccountSettings({ settings }: { settings: SettingsData }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    setSaving(true);
    const result = await changePassword(oldPassword, newPassword);
    if (result.success) {
      setSuccess('เปลี่ยนรหัสผ่านสำเร็จ!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await deleteAccount();
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <div>
      <h1 className="settings-title">ตั้งค่าบัญชี</h1>
      <p className="settings-desc">จัดการความปลอดภัยของบัญชีและอีเมลของคุณ</p>

      {/* Email display (read-only) */}
      <div className="settings-form">
        <div className="settings-field">
          <label>ที่อยู่อีเมล</label>
          <input type="email" value={settings.email || ''} readOnly style={{ opacity: 0.7 }} />
        </div>
      </div>

      {/* Password section - only show for credential users */}
      {settings.hasPassword && !settings.isOAuth && (
        <>
          <h2 className="settings-section-title" style={{ marginTop: '32px' }}>รหัสผ่าน</h2>
          <div className="settings-form">
            <div className="settings-field">
              <label>รหัสผ่านเดิม</label>
              <div className="settings-input-password">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิม"
                />
                <button className="btn-icon-inline" onClick={() => setShowOldPassword(!showOldPassword)}>
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label>รหัสผ่านใหม่</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="กรอกรหัสผ่านใหม่" />
            </div>

            <div className="settings-field">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" />
            </div>

            {error && <div className="settings-error">{error}</div>}
            {success && <div className="settings-success">{success}</div>}

            <button className="btn-primary" onClick={handleChangePassword} disabled={saving} style={{ marginTop: '8px' }}>
              {saving ? 'กำลังอัปเดต...' : 'อัปเดตรหัสผ่าน'}
            </button>
          </div>
        </>
      )}

      {settings.isOAuth && (
        <div className="settings-info-box" style={{ marginTop: '32px' }}>
          <p>บัญชีนี้เข้าสู่ระบบผ่าน Social Login จึงไม่สามารถเปลี่ยนรหัสผ่านได้</p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="settings-danger-zone">
        <h3>ลบบัญชี</h3>
        <p>เมื่อลบบัญชีแล้วจะไม่สามารถกู้คืนได้ ข้อมูลพรอมต์ สถิติต่างๆ และประวัติในคอมมูนิตี้ทั้งหมดจะถูกลบอย่างถาวร โปรดตรวจสอบให้แน่ใจก่อนดำเนินการ</p>
        {!deleteConfirm ? (
          <button className="btn-danger" onClick={() => setDeleteConfirm(true)}>
            ยืนยันการลบบัญชี
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'กำลังลบ...' : '⚠️ ลบบัญชีถาวร'}
            </button>
            <button className="btn-text" onClick={() => setDeleteConfirm(false)}>
              ยกเลิก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
