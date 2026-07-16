'use client';

import { useState, useRef } from 'react';
import { User } from 'lucide-react';
import { updateProfile } from '@/lib/actions/user';

interface SettingsData {
  id: string;
  name: string | null;
  handle: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
}

export default function ProfileSettings({ settings }: { settings: SettingsData }) {
  const [name, setName] = useState(settings.name || '');
  const [handle, setHandle] = useState(settings.handle || '');
  const [bio, setBio] = useState(settings.bio || '');
  const [githubUrl, setGithubUrl] = useState(settings.githubUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(settings.twitterUrl || '');
  const [avatarPreview, setAvatarPreview] = useState(settings.image || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    let imageUrl = settings.image || undefined;

    // Upload avatar if changed
    if (avatarFile) {
      const formData = new FormData();
      formData.append('file', avatarFile);
      formData.append('bucket', 'avatars');
      try {
        const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          imageUrl = data.url;
        } else {
          setError('อัปโหลดรูปโปรไฟล์ล้มเหลว');
          setSaving(false);
          return;
        }
      } catch {
        setError('อัปโหลดรูปโปรไฟล์ล้มเหลว');
        setSaving(false);
        return;
      }
    }

    if (avatarPreview === '' && settings.image) {
      imageUrl = '';
    }

    const result = await updateProfile({
      name,
      handle,
      bio,
      githubUrl,
      twitterUrl,
      image: imageUrl,
    });

    if (result.success) {
      setSuccess('บันทึกสำเร็จ!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="settings-title">โปรไฟล์สาธารณะ</h1>
      <p className="settings-desc">ข้อมูลนี้จะถูกแสดงต่อสาธารณะ โปรดระมัดระวังในการแชร์ข้อมูลส่วนตัว</p>

      {/* Avatar Section */}
      <div className="settings-avatar-section">
        <div className="settings-avatar">
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" />
          ) : (
            <User size={40} />
          )}
        </div>
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        <button className="btn-outline-blue" onClick={() => fileInputRef.current?.click()}>
          เปลี่ยนรูปโปรไฟล์
        </button>
        {avatarPreview && (
          <button className="btn-text-danger" onClick={removeAvatar}>
            ลบรูป
          </button>
        )}
      </div>

      {/* Form Fields */}
      <div className="settings-form">
        <div className="settings-field">
          <label>ชื่อ-นามสกุล</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" />
        </div>

        <div className="settings-field">
          <label>ชื่อผู้ใช้</label>
          <div className="settings-input-prefix">
            <span className="input-prefix">@</span>
            <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="username" />
          </div>
        </div>

        <div className="settings-field">
          <label>เกี่ยวกับฉัน</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="คำอธิบายสั้นๆ สำหรับโปรไฟล์ของคุณ ลิงก์ URL จะสามารถคลิกได้"
            rows={4}
          />
        </div>

        <h3 className="settings-section-title">ช่องทางการติดต่อ</h3>

        <div className="settings-field">
          <div className="settings-input-prefix">
            <span className="input-prefix">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </span>
            <input type="text" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL" />
          </div>
        </div>

        <div className="settings-field">
          <div className="settings-input-prefix">
            <span className="input-prefix">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </span>
            <input type="text" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="X (Twitter) URL" />
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="settings-error">{error}</div>}
      {success && <div className="settings-success">{success}</div>}

      {/* Actions */}
      <div className="settings-actions">
        <button className="btn-text" onClick={() => window.location.reload()}>ยกเลิก</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  );
}
