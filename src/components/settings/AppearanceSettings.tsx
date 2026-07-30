'use client';

import { useState } from 'react';
import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { updatePreferences } from '@/lib/actions/user';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useCodeTheme } from '@/components/providers/CodeThemeProvider';
import hljs from 'highlight.js';

const THEMES = [
  { value: 'light', label: 'สว่าง', icon: Sun },
  { value: 'dark', label: 'มืด', icon: Moon },
  { value: 'system', label: 'ตามระบบ', icon: Monitor },
];

const CODE_THEMES = [
  'VS Code Dark Modern',
  'GitHub Dark',
  'Monokai',
  'One Dark Pro',
  'Night Owl',
];

const PREVIEW_CODE = `const generatePrompt = async (context) => {
  const theme = context.settings.theme;
  if (theme === 'dark') {
    return 'System initialized in dark mode.';
  }
  return 'System initialized in standard mode.';
};`;

interface SettingsData {
  theme: string;
  codeTheme: string;
}

export default function AppearanceSettings({ settings }: { settings: SettingsData }) {
  const { setTheme: applyTheme } = useTheme();
  const { setCodeTheme: applyCodeTheme } = useCodeTheme();

  const [theme, setTheme] = useState(settings.theme || 'system');
  const [codeTheme, setCodeTheme] = useState(settings.codeTheme || 'VS Code Dark Modern');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSelectTheme = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme as 'light' | 'dark' | 'system');
  };

  const handleSelectCodeTheme = (newCodeTheme: string) => {
    setCodeTheme(newCodeTheme);
    applyCodeTheme(newCodeTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    await updatePreferences({ theme, codeTheme });
    applyTheme(theme as 'light' | 'dark' | 'system');
    applyCodeTheme(codeTheme);
    setSuccess('บันทึกการตั้งค่าสำเร็จ!');
    setTimeout(() => setSuccess(''), 3000);
    setSaving(false);
  };

  return (
    <div>
      <h1 className="settings-title">การแสดงผล</h1>
      <p className="settings-desc">ปรับแต่งการแสดงผลบนหน้าจอของคุณ</p>

      {/* Theme Selector */}
      <h2 className="settings-section-title">โหมดการแสดงผล</h2>
      <div className="theme-selector">
        {THEMES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              className={`theme-option ${theme === t.value ? 'active' : ''}`}
              onClick={() => handleSelectTheme(t.value)}
            >
              <div className="theme-preview">
                <div className={`theme-preview-screen ${t.value}`}>
                  <div className="theme-preview-sidebar" />
                  <div className="theme-preview-content" />
                </div>
              </div>
              <span className="theme-label">
                <Icon size={14} /> {t.label}
              </span>
              {theme === t.value && (
                <span className="theme-check"><Check size={14} /></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Code Theme Selector */}
      <h2 className="settings-section-title" style={{ marginTop: '32px' }}>ธีมของกล่องแก้ไขโค้ด</h2>
      <p className="settings-desc" style={{ marginBottom: '12px' }}>เลือกธีมสีเน้นไวยากรณ์(Syntax Highlighting)สำหรับชุดโค้ด</p>

      <select
        className="settings-select"
        value={codeTheme}
        onChange={(e) => handleSelectCodeTheme(e.target.value)}
      >
        {CODE_THEMES.map((ct) => (
          <option key={ct} value={ct}>{ct}</option>
        ))}
      </select>

      {/* Preview */}
      <div className="code-theme-preview">
        <div className="code-theme-preview-header">
          <div className="code-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="code-filename">preview.js</span>
        </div>
        <pre className="code-theme-preview-body">
          <code dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(PREVIEW_CODE).value }} />
        </pre>
      </div>

      {success && <div className="settings-success" style={{ marginTop: '16px' }}>{success}</div>}

      <div className="settings-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}
