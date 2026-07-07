import { Trophy } from 'lucide-react';

const contributors = [
  { name: '@park', score: '1.2k แต้ม', color: '#8b5cf6' },
  { name: '@mikk', score: '900 แต้ม', color: '#f59e0b' },
  { name: '@pat', score: '850 แต้ม', color: '#ef4444' },
];

export default function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <div className="right-card">
        <div className="right-card-title">
          <Trophy size={18} style={{ color: '#f59e0b' }} />
          ผู้มีส่วนร่วมสูงสุด
        </div>

        {contributors.map((user) => (
          <div key={user.name} className="contributor-item">
            <div
              className="contributor-avatar"
              style={{ background: user.color }}
            >
              {user.name.charAt(1).toUpperCase()}
            </div>
            <div className="contributor-info">
              <div className="contributor-name">{user.name}</div>
            </div>
            <div className="contributor-score">{user.score}</div>
          </div>
        ))}

        <button className="btn-outline">ดูอันดับทั้งหมด</button>
      </div>
    </aside>
  );
}
