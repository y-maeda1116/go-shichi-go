import { useState, useEffect } from 'react'

interface NotificationItem {
  id: string
  type: 'like' | 'follow'
  fromUserName: string
  postId?: string
  createdAt: string
  read: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const saved = localStorage.getItem('notifications')
    if (saved) {
      setNotifications(JSON.parse(saved))
    }
  }, [])

  const markRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      localStorage.setItem('notifications', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="notification-bell">
      <button className="bell-button" onClick={() => { setOpen(!open); markRead() }}>
        🔔 {unread > 0 && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          {notifications.length === 0 && (
            <p className="notification-empty">通知はありません</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}>
              <span className="notification-icon">{n.type === 'like' ? '♥' : '👤'}</span>
              <span className="notification-text">
                {n.type === 'like'
                  ? `${n.fromUserName}があなたの投稿にいいねしました`
                  : `${n.fromUserName}があなたをフォローしました`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
