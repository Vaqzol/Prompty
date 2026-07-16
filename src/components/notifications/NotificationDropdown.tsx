'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, Sparkles, MessageSquare, ArrowBigUp, UserPlus } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/actions/notification';

interface NotificationData {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  actorName: string | null;
  postTitle: string | null;
  createdAt: Date | string;
}

function timeAgoShort(date: Date | string) {
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาที`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.`;
  return `${Math.floor(diff / 86400)} วัน`;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 1 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
      // Hide the red dot immediately when opened
      setUnreadCount(0);
      // Optional: you can mark all as read here if you want them to be read upon opening
      // markAllAsRead();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = () => {
    setIsOpen(false);
  };

  const handleNotificationHover = (notif: NotificationData) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <button className="btn btn-icon notification-bell" onClick={handleToggle} title="การแจ้งเตือน">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-bell-dot" />}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button className="btn-text-small" onClick={handleMarkAllRead}>
                <Check size={14} /> อ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">ไม่มีการแจ้งเตือน</div>
            ) : (
              notifications.map((notif) => {
                let Icon = Bell;
                let iconColor = 'var(--text-muted)';
                if (notif.type === 'VOTE') { Icon = ArrowBigUp; iconColor = 'var(--success)'; }
                if (notif.type === 'COMMENT') { Icon = MessageSquare; iconColor = 'var(--brand-primary)'; }
                if (notif.type === 'FOLLOW') { Icon = UserPlus; iconColor = '#8b5cf6'; }
                if (notif.type === 'COPY_MILESTONE') { Icon = Sparkles; iconColor = '#f59e0b'; }

                const Content = () => (
                  <div 
                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`} 
                    onClick={handleNotificationClick}
                    onMouseEnter={() => handleNotificationHover(notif)}
                  >
                    <div className="notification-icon" style={{ color: iconColor }}>
                      <Icon size={18} />
                    </div>
                    <div className="notification-content">
                      <p>
                        {notif.actorName && <strong>{notif.actorName} </strong>}
                        {notif.message}
                      </p>
                      {notif.postTitle && <span className="notification-post-title">{notif.postTitle}</span>}
                      <span className="notification-time">{timeAgoShort(notif.createdAt)}</span>
                    </div>
                    {!notif.isRead && <span className="notification-item-dot" />}
                  </div>
                );

                return notif.link ? (
                  <Link key={notif.id} href={notif.link} style={{ textDecoration: 'none' }}>
                    <Content />
                  </Link>
                ) : (
                  <div key={notif.id}>
                    <Content />
                  </div>
                );
              })
            )}
          </div>
          <div className="notification-footer">
            <Link href="/settings/notifications" onClick={() => setIsOpen(false)}>
              ตั้งค่าการแจ้งเตือน
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
