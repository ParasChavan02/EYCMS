import { useNotification } from '../../hooks/useNotification'
import './toast.css'

function Toast() {
  const { notifications } = useNotification()

  // Filter notifications that should show as toast (temporary)
  const toastNotifications = notifications.filter(n => !n.showInBell)

  return (
    <div className="toast-container">
      {toastNotifications.map(notification => (
        <div
          key={notification.id}
          className={`toast toast--${notification.type}`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  )
}

export default Toast
