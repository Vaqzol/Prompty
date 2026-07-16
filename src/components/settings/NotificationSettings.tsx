'use client';

import { useState } from 'react';
import { Lock, Save } from 'lucide-react';
import { updatePreferences } from '@/lib/actions/user';

interface SettingsData {
  notifyComments: boolean;
  notifyVotes: boolean;
  notifyFollowers: boolean;
  notifyDigest: boolean;
  notifySecurity: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`toggle-switch ${checked ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export default function NotificationSettings({ settings }: { settings: SettingsData }) {
  const [notifyComments, setNotifyComments] = useState(settings.notifyComments);
  const [notifyVotes, setNotifyVotes] = useState(settings.notifyVotes);
  const [notifyFollowers, setNotifyFollowers] = useState(settings.notifyFollowers);
  const [notifyDigest, setNotifyDigest] = useState(settings.notifyDigest);
  const [notifySecurity] = useState(settings.notifySecurity);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    await updatePreferences({
      notifyComments,
      notifyVotes,
      notifyFollowers,
      notifyDigest,
    });
    setSuccess('บันทึกการตั้งค่าสำเร็จ!');
    setTimeout(() => setSuccess(''), 3000);
    setSaving(false);
  };

  return (
    <div>
      <h1 className="settings-title">ตั้งค่าการแจ้งเตือน</h1>
      <p className="settings-desc">เลือกประเภทและช่องทางการแจ้งเตือนที่คุณต้องการ</p>

      {/* In-App Notifications */}
      <h2 className="settings-section-title">การแจ้งเตือนในแอป</h2>
      <div className="settings-toggle-list">
        <div className="settings-toggle-item">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">ความคิดเห็น</span>
            <span className="settings-toggle-desc">แจ้งเตือนเมื่อมีคนมาแสดงความคิดเห็นในโพสต์ของคุณ</span>
          </div>
          <ToggleSwitch checked={notifyComments} onChange={setNotifyComments} />
        </div>

        <div className="settings-toggle-item">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">การโหวต</span>
            <span className="settings-toggle-desc">แจ้งเตือนเมื่อโค้ดหรือพรอมต์ของคุณได้รับการโหวต</span>
          </div>
          <ToggleSwitch checked={notifyVotes} onChange={setNotifyVotes} />
        </div>

        <div className="settings-toggle-item">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">ผู้ติดตามใหม่</span>
            <span className="settings-toggle-desc">แจ้งเตือนเมื่อมีคนมาติดตามโปรไฟล์ของคุณ</span>
          </div>
          <ToggleSwitch checked={notifyFollowers} onChange={setNotifyFollowers} />
        </div>
      </div>

      {/* Email Notifications */}
      <h2 className="settings-section-title" style={{ marginTop: '32px' }}>การแจ้งเตือนทางอีเมล</h2>
      <div className="settings-toggle-list">
        <div className="settings-toggle-item">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">สรุปการเคลื่อนไหวรายสัปดาห์</span>
            <span className="settings-toggle-desc">รับอีเมลสรุปประจำสัปดาห์เกี่ยวกับ React component และ AI prompt ที่กำลังมาแรง</span>
          </div>
          <ToggleSwitch checked={notifyDigest} onChange={setNotifyDigest} />
        </div>

        <div className="settings-toggle-item highlight">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">
              การแจ้งเตือนความปลอดภัย <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
            </span>
            <span className="settings-toggle-desc">การแจ้งเตือนที่สำคัญเกี่ยวกับความปลอดภัยของบัญชีคุณ (จำเป็น)</span>
          </div>
          <ToggleSwitch checked={notifySecurity} onChange={() => {}} disabled />
        </div>
      </div>

      {success && <div className="settings-success" style={{ marginTop: '16px' }}>{success}</div>}

      <div className="settings-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}
