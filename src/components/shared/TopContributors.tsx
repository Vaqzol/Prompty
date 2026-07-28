import Link from 'next/link';
import { Trophy } from 'lucide-react';

export interface Contributor {
  id: string;
  name: string | null;
  image: string | null;
  handle: string | null;
  totalScore: number;
}

interface TopContributorsProps {
  contributors: Contributor[];
}

export default function TopContributors({ contributors }: TopContributorsProps) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <aside className="top-contributors-card">
      <div className="top-contributors-header">
        <div className="top-contributors-title">
          <Trophy size={20} className="trophy-icon" style={{ color: '#f59e0b' }} />
          <span>ผู้มีส่วนร่วมสูงสุด</span>
        </div>
        <p className="top-contributors-subtitle">ผู้ที่ได้รับคะแนนสูงสุด</p>
      </div>

      <div className="top-contributors-list">
        {contributors.length === 0 ? (
          <div className="empty-contributors">ยังไม่มีข้อมูล</div>
        ) : (
          contributors.map((user, index) => {
            const isTop1 = index === 0;
            const rankBadge = index < 3 ? medals[index] : index + 1;

            return (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className={`contributor-item ${isTop1 ? 'top-1' : ''}`}
              >
                <div className="contributor-rank">{rankBadge}</div>

                <div className="contributor-avatar">
                  {user.image ? (
                    <img src={user.image} alt={user.name || ''} />
                  ) : (
                    <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="contributor-info">
                  <div className="contributor-name">{user.name}</div>
                  <div className="contributor-handle">@{user.handle}</div>
                </div>

                <div className="contributor-score-box">
                  <span className={`contributor-score ${isTop1 ? 'score-highlight' : ''}`}>
                    {user.totalScore.toLocaleString()}
                  </span>
                  <span className="contributor-score-label">คะแนน</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="top-contributors-footer">
        <Link href="/leaderboard" className="view-all-link">
          ดูอันดับทั้งหมด
        </Link>
      </div>
    </aside>
  );
}
