import { useState } from 'react'
import { useNotification } from '../../hooks/useNotification'
import './notificationBell.css'

function NotificationBell() {
  const { notifications, removeNotification } = useNotification()
  const [isOpen, setIsOpen] = useState(false)

  // Count unread notifications
  const unreadCount = notifications.length

  const handleClearAll = () => {
    notifications.forEach(n => removeNotification(n.id))
    setIsOpen(false)
  }

  return (
    <div className="notification-bell-wrapper">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                className="clear-all-btn"
                onClick={handleClearAll}
                type="button"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification.id} className={`notification-item notification-item--${notification.type}`}>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                  </div>
                  <button
                    className="notification-close"
                    onClick={() => removeNotification(notification.id)}
                    type="button"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="notification-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationBell
