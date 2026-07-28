'use client';

import './leaderboard.css';
import { useState } from 'react';
import Link from 'next/link';
import { getLeaderboard, getCurrentUserRank } from '@/lib/actions/trending';

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  image: string | null;
  handle: string;
  copyCount: number;
  voteScore: number;
  totalScore: number;
}

interface LeaderboardClientProps {
  initialLeaderboard: LeaderboardUser[];
  initialCurrentUserRank: LeaderboardUser | null;
  currentUserId?: string;
}

function formatShortNum(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export default function LeaderboardClient({
  initialLeaderboard,
  initialCurrentUserRank,
  currentUserId,
}: LeaderboardClientProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(initialLeaderboard);
  const [myRank, setMyRank] = useState<LeaderboardUser | null>(initialCurrentUserRank);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(initialLeaderboard.length >= 20);

  const handlePeriodChange = async (newPeriod: 'week' | 'month' | 'all') => {
    setPeriod(newPeriod);
    setLoading(true);
    try {
      const [newLeaderboard, newMyRank] = await Promise.all([
        getLeaderboard(newPeriod, 20),
        currentUserId ? getCurrentUserRank(currentUserId, newPeriod) : Promise.resolve(null),
      ]);
      setLeaderboard(newLeaderboard);
      setMyRank(newMyRank);
      setLimit(20);
      setHasMore(newLeaderboard.length >= 20);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const nextLimit = limit + 20;
    setLoading(true);
    try {
      const newLeaderboard = await getLeaderboard(period, nextLimit);
      setLeaderboard(newLeaderboard);
      setLimit(nextLimit);
      setHasMore(newLeaderboard.length >= nextLimit);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        {/* Header */}
        <header className="leaderboard-header">
          <h1>🏆 ตารางอันดับ</h1>
          <p>ครีเอเตอร์ที่มีส่วนร่วมและช่วยเหลือชุมชน Prompty มากที่สุด</p>

          {/* Period Pills */}
          <div className="period-pills-container">
            <div
              className="period-pill-slider"
              style={{
                transform:
                  period === 'week'
                    ? 'translateX(0%)'
                    : period === 'month'
                    ? 'translateX(100%)'
                    : 'translateX(200%)',
              }}
            />
            <button
              className={`period-pill-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('week')}
            >
              สัปดาห์นี้
            </button>
            <button
              className={`period-pill-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('month')}
            >
              เดือนนี้
            </button>
            <button
              className={`period-pill-btn ${period === 'all' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('all')}
            >
              ทั้งหมด
            </button>
          </div>
        </header>

        {/* Table Card */}
        <div className="leaderboard-table-card">
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="col-rank">อันดับ</th>
                  <th className="col-user">ผู้ใช้งาน</th>
                  <th className="col-num">ยอดคัดลอก</th>
                  <th className="col-num">คะแนนโหวต</th>
                  <th className="col-total">คะแนนรวม</th>
                </tr>
              </thead>
              <tbody key={period}>
                {loading && leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      ยังไม่มีข้อมูลอันดับในขณะนี้
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((user, index) => {
                    const isTop1 = user.rank === 1;
                    const rankMedal = user.rank <= 3 ? medals[user.rank - 1] : null;

                    return (
                      <tr
                        key={`${period}-${user.id}`}
                        className={`leaderboard-row ${isTop1 ? 'rank-top-1' : ''}`}
                        style={{ animationDelay: `${index * 0.04}s` }}
                      >
                        <td className="col-rank">
                          {rankMedal ? (
                            <span className="rank-badge-medal">{rankMedal}</span>
                          ) : (
                            <span className="rank-badge-number">{user.rank}</span>
                          )}
                        </td>
                        <td className="col-user">
                          <Link href={`/profile/${user.id}`} className="user-cell-content">
                            <div className="user-cell-avatar">
                              {user.image ? (
                                <img src={user.image} alt={user.name} />
                              ) : (
                                <span>{user.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="user-cell-details">
                              <span className="user-cell-name">{user.name}</span>
                              <span className="user-cell-handle">@{user.handle}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="col-num">{formatShortNum(user.copyCount)}</td>
                        <td className="col-num">{formatShortNum(user.voteScore)}</td>
                        <td className="col-total">{user.totalScore.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Current User Row */}
          {myRank && (
            <div className="current-user-row-container">
              <div className="current-user-left">
                <span className="current-user-rank-badge">อันดับ {myRank.rank}</span>
                <div className="current-user-info">
                  <div className="current-user-avatar">
                    {myRank.image ? (
                      <img src={myRank.image} alt={myRank.name} />
                    ) : (
                      <span>{myRank.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="current-user-name">You ({myRank.name})</span>
                </div>
              </div>

              <div className="current-user-right">
                <div className="current-user-score-box">
                  <span className="current-user-score-label">คะแนน</span>
                  <span className="current-user-score-val">{myRank.totalScore.toLocaleString()}</span>
                </div>
                <Link href="/profile" className="btn-view-my-profile">
                  ดูโปรไฟล์
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="load-more-container">
            <button className="btn-load-more" onClick={handleLoadMore} disabled={loading}>
              {loading ? 'กำลังโหลด...' : 'ดูเพิ่มเติม'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
