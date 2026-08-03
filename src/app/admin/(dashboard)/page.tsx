import {
  getDashboardStats,
  getDailyPostStats,
  getRecentActivities,
  getPopularTags,
} from '@/lib/actions/admin';
import { Users, FileText, Globe, AlertCircle, MoreHorizontal } from 'lucide-react';
import DashboardChart from '@/components/admin/DashboardChart';

function formatActivityTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  let relative = '';
  if (diffSec < 60) relative = 'เมื่อกี้';
  else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
  else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)} ชม. ที่แล้ว`;
  else relative = `${Math.floor(diffSec / 86400)} วันที่แล้ว`;

  const dateStr = d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  });
  const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return `${dateStr} (${timeStr}) • ${relative}`;
}

export default async function AdminDashboardPage() {
  const [stats, dailyData, activities, popularTags] = await Promise.all([
    getDashboardStats(),
    getDailyPostStats(),
    getRecentActivities(),
    getPopularTags(),
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">ภาพรวมระบบ (Dashboard)</h1>
        <p className="admin-page-desc">ข้อมูลสถิติและความเคลื่อนไหวล่าสุด</p>
      </div>

      {/* 4 Stat Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-wrapper blue">
              <Users size={20} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>
              {stats.userGrowth}
            </span>
          </div>
          <div>
            <div className="admin-stat-label">ผู้ใช้งานทั้งหมด</div>
            <div className="admin-stat-value">{stats.totalUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-wrapper purple">
              <FileText size={20} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>
              {stats.postGrowth}
            </span>
          </div>
          <div>
            <div className="admin-stat-label">โพสต์ทั้งหมด</div>
            <div className="admin-stat-value">{stats.totalPosts.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-wrapper gray">
              <Globe size={20} />
            </div>
          </div>
          <div>
            <div className="admin-stat-label">โพสต์วันนี้</div>
            <div className="admin-stat-value">{stats.todayPosts.toLocaleString()}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <div className="admin-stat-icon-wrapper red">
              <AlertCircle size={20} />
            </div>
          </div>
          <div>
            <div className="admin-stat-label">รอตรวจสอบ</div>
            <div className="admin-stat-value red">{stats.pendingReports.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Area Chart Section */}
      <div className="admin-chart-card">
        <div className="admin-chart-header">
          <div className="admin-chart-title">สถิติการใช้งาน (30 วันที่ผ่านมา)</div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <MoreHorizontal size={18} />
          </button>
        </div>
        <DashboardChart data={dailyData} />
      </div>

      {/* Bottom 2 Columns: Activity & Popular Tags */}
      <div className="admin-grid-2col">
        {/* กิจกรรมล่าสุด */}
        <div className="admin-card">
          <h2 className="admin-card-title">กิจกรรมล่าสุด</h2>
          <div className="admin-activity-list">
            {activities.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>ยังไม่มีกิจกรรม</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="admin-activity-item">
                  <img
                    src={act.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt=""
                    className="admin-activity-avatar"
                  />
                  <div>
                    <div className="admin-activity-text">{act.text}</div>
                    <div className="admin-activity-time">
                      {formatActivityTime(act.time)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* แท็กยอดนิยม */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="admin-card-title" style={{ margin: 0 }}>แท็กยอดนิยม</h2>
          </div>

          <div className="admin-tags-list">
            {popularTags.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>ยังไม่มีแท็ก</div>
            ) : (
              popularTags.map((t, idx) => {
                const maxCount = popularTags[0]?.count || 1;
                const percentage = Math.round((t.count / maxCount) * 100);

                return (
                  <div key={t.name} className="admin-tag-row">
                    <div className="admin-tag-info">
                      <span className="admin-tag-name">{t.name}</span>
                      <span className="admin-tag-count">{t.count} โพสต์</span>
                    </div>
                    <div className="admin-tag-bar-bg">
                      <div className="admin-tag-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
