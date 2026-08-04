'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import {
  getAdminProfile,
  updateAdminPassword,
  updateAdminEmail,
  getSystemSettings,
  updateSystemSetting,
} from '@/lib/actions/admin';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');

  // Profile State
  const [profile, setProfile] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    handle: string | null;
    role: string;
    image: string | null;
  } | null>(null);

  // Email Edit State
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // System Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoHideReports, setAutoHideReports] = useState(true);
  const [systemLoading, setSystemLoading] = useState(true);

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      try {
        const [profData, sysData] = await Promise.all([
          getAdminProfile(),
          getSystemSettings(),
        ]);
        if (profData) {
          setProfile(profData);
          setEmailInput(profData.email || '');
        }
        if (sysData) {
          setMaintenanceMode(sysData.maintenanceMode);
          setAutoHideReports(sysData.autoHideReports);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setSystemLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle Email Update
  const handleUpdateEmail = async () => {
    if (!editingEmail) {
      setEditingEmail(true);
      return;
    }

    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const res = await updateAdminEmail(emailInput);
      if (!res.success) {
        setEmailError(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนอีเมล');
      } else {
        setEmailSuccess('เปลี่ยนอีเมลสำเร็จ');
        setEditingEmail(false);
        if (profile) setProfile({ ...profile, email: emailInput });
      }
    } catch (err: any) {
      setEmailError(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError('');
    setPassSuccess('');

    try {
      const res = await updateAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setPassError(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      } else {
        setPassSuccess('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPassError(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setPassLoading(false);
    }
  };

  // Handle Toggle Switch
  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    if (key === 'maintenance_mode') setMaintenanceMode(newValue);
    if (key === 'auto_hide_reports') setAutoHideReports(newValue);

    try {
      await updateSystemSetting(key, newValue);
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
      // Revert on error
      if (key === 'maintenance_mode') setMaintenanceMode(currentValue);
      if (key === 'auto_hide_reports') setAutoHideReports(currentValue);
    }
  };

  const handleDisplay = profile?.handle
    ? `@${profile.handle.replace(/^@/, '')}`
    : `@${profile?.name || 'admin_prompty'}`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Title Header (Matches Figma Image 2) */}
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: '20px',
          letterSpacing: '-0.02em',
        }}
      >
        การตั้งค่า
      </h1>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '32px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '32px',
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '12px 4px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'profile'
                ? '2px solid #0066ff'
                : '2px solid transparent',
            color: activeTab === 'profile' ? '#0066ff' : '#64748b',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          โปรไฟล์
        </button>
        <button
          onClick={() => setActiveTab('system')}
          style={{
            padding: '12px 4px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'system'
                ? '2px solid #0066ff'
                : '2px solid transparent',
            color: activeTab === 'system' ? '#0066ff' : '#64748b',
            fontWeight: activeTab === 'system' ? 700 : 500,
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ระบบ
        </button>
      </div>

      {/* ───────────────────────────────────────────── */}
      {/* TAB 1: โปรไฟล์ (Figma Image 1) */}
      {/* ───────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Avatar Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <img
              src={
                profile?.image ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
              }
              alt=""
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #f1f5f9',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => alert('ฟังก์ชันอัพโหลดรูปภาพจะพร้อมใช้งานในเวอร์ชันถัดไป')}
                style={{
                  background: '#0066ff',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                เปลี่ยนรูปภาพ
              </button>
              <button
                type="button"
                onClick={() => alert('ฟังก์ชันลบรูปภาพจะพร้อมใช้งานในเวอร์ชันถัดไป')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                ลบ
              </button>
            </div>
          </div>

          {/* Field 1: ชื่อผู้ใช้งาน */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px',
              }}
            >
              ชื่อผู้ใช้งาน
            </label>
            <input
              type="text"
              readOnly
              value={handleDisplay}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Field 2: อีเมล */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px',
              }}
            >
              อีเมล
            </label>

            {emailError && (
              <div
                style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div
                style={{
                  color: '#10b981',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                {emailSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="email"
                readOnly={!editingEmail}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: editingEmail ? '#ffffff' : '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleUpdateEmail}
                disabled={emailLoading}
                style={{
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  color: '#0066ff',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {emailLoading
                  ? 'กำลังบันทึก...'
                  : editingEmail
                  ? 'บันทึกอีเมล'
                  : 'เปลี่ยนอีเมล'}
              </button>
            </div>
          </div>

          {/* Field 3: ตำแหน่ง (Role) */}
          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px',
              }}
            >
              ตำแหน่ง (Role)
            </label>
            <input
              type="text"
              readOnly
              value="ผู้ดูแลระบบ (Administrator)"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f1f5f9',
                color: '#334155',
                outline: 'none',
                boxSizing: 'border-box',
                fontWeight: 500,
              }}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '28px',
            }}
          />

          {/* Section: เปลี่ยนรหัสผ่าน */}
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '20px',
            }}
          >
            เปลี่ยนรหัสผ่าน
          </h2>

          <form onSubmit={handleUpdatePassword}>
            {passError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {passError}
              </div>
            )}
            {passSuccess && (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #6ee7b7',
                  color: '#047857',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {passSuccess}
              </div>
            )}

            {/* รหัสผ่านเดิม */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                รหัสผ่านเดิม
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 16px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* รหัสผ่านใหม่ */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=""
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* ยืนยันรหัสผ่านใหม่ */}
            <div style={{ marginBottom: '28px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder=""
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={passLoading}
                style={{
                  background: '#0066ff',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)',
                }}
              >
                {passLoading ? 'กำลังบันทึก...' : 'อัพเดทรหัสผ่าน'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────── */}
      {/* TAB 2: ระบบ (Figma Image 2) */}
      {/* ───────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px 32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          {systemLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              กำลังโหลดการตั้งค่าระบบ...
            </div>
          ) : (
            <>
              {/* Row 1: โหมดซ่อมบำรุง */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: '4px',
                    }}
                  >
                    โหมดซ่อมบำรุง (Maintenance Mode)
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    ปิดไม่ให้ผู้ใช้งานทั่วไปเข้าถึงเว็บไซต์ชั่วคราวเพื่ออัปเดตระบบ
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  onClick={() =>
                    handleToggleSetting('maintenance_mode', maintenanceMode)
                  }
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '9999px',
                    background: maintenanceMode ? '#0066ff' : '#cbd5e1',
                    padding: '3px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: maintenanceMode
                        ? 'translateX(22px)'
                        : 'translateX(0)',
                      transition: 'transform 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  margin: '20px 0',
                }}
              />

              {/* Row 2: ซ่อนโพสต์อัตโนมัติ */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: '4px',
                    }}
                  >
                    ซ่อนโพสต์อัตโนมัติ (Auto-Hide)
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    ซ่อนโพสต์จากหน้าฟีดทันทีหากถูกรายงานปัญหาเกิน 10 ครั้ง
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  onClick={() =>
                    handleToggleSetting('auto_hide_reports', autoHideReports)
                  }
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '9999px',
                    background: autoHideReports ? '#0066ff' : '#cbd5e1',
                    padding: '3px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: autoHideReports
                        ? 'translateX(22px)'
                        : 'translateX(0)',
                      transition: 'transform 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
