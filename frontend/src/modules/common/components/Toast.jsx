import { useNotification } from '../hooks/useNotification';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import './toast.css';

function Toast() {
  const { notifications, toasts } = useNotification();

  // Use dedicated toasts array from context or fallback to filter
  const toastList = (toasts && toasts.length > 0)
    ? toasts 
    : (notifications || []).filter((n) => n.isToast || !n.showInBell);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} style={{ flexShrink: 0 }} />;
      case 'error':
        return <XCircle size={20} style={{ flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={20} style={{ flexShrink: 0 }} />;
      default:
        return <Info size={20} style={{ flexShrink: 0 }} />;
    }
  };

  return (
    <div className="toast-container">
      {toastList.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast--${notification.type}`}
          role="alert"
        >
          {getIcon(notification.type)}
          <span>{notification.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Toast;

