'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MoreHorizontal, RefreshCw, Calendar } from 'lucide-react';
import { getDailyPostStats } from '@/lib/actions/admin';

interface DailyStat {
  date: string;
  postsCount: number;
}

export default function DashboardChart({ initialData }: { initialData: DailyStat[] }) {
  const [data, setData] = useState<DailyStat[]>(initialData);
  const [days, setDays] = useState<number>(30);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDays = async (selectedDays: number) => {
    setDays(selectedDays);
    setIsMenuOpen(false);
    setLoading(true);
    try {
      const newData = await getDailyPostStats(selectedDays);
      setData(newData);
    } catch (err) {
      console.error('Failed to load chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsMenuOpen(false);
    setLoading(true);
    try {
      const newData = await getDailyPostStats(days);
      setData(newData);
    } catch (err) {
      console.error('Failed to refresh chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-chart-card">
      <div className="admin-chart-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="admin-chart-title" style={{ margin: 0 }}>สถิติการใช้งาน</div>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            {days} วัน
          </span>
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: isMenuOpen ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="ตัวเลือกสถิติ"
          >
            <MoreHorizontal size={18} />
          </button>

          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                minWidth: '160px',
                zIndex: 50,
                padding: '4px',
              }}
            >
              {[
                { label: '7 วันล่าสุด', val: 7 },
                { label: '30 วันล่าสุด', val: 30 },
                { label: '90 วันล่าสุด', val: 90 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleSelectDays(opt.val)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: 'none',
                    background: days === opt.val ? 'var(--bg-secondary)' : 'transparent',
                    color: days === opt.val ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: days === opt.val ? 600 : 400,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Calendar size={14} />
                  {opt.label}
                </button>
              ))}

              <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }} />

              <button
                onClick={handleRefresh}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                รีเฟรชข้อมูล
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height: 260, opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
              formatter={(value: any) => [`${value ?? 0} โพสต์`, 'โพสต์ใหม่']}
              labelFormatter={(label) => `วันที่: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="postsCount"
              stroke="#2563eb"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPosts)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
