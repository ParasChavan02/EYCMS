import { createContext, useCallback, useState } from "react";
import { ROUTES } from "../constants/routes";

export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([
    {
      id: 101,
      title: "Budget warning",
      message: "Equipment head crossed 82 percent utilization.",
      type: "warning",
      showInBell: true,
      time: "5 mins ago",
      actionLabel: "Review budgets",
      actionPath: ROUTES.ADMIN_BUDGET_HEADS,
    },
    {
      id: 102,
      title: "Pending approvals",
      message: "12 items are waiting in the approval center.",
      type: "info",
      showInBell: true,
      time: "12 mins ago",
      actionLabel: "Open queue",
      actionPath: ROUTES.ADMIN_APPROVALS,
    },
    {
      id: 103,
      title: "Failed reconciliation sync",
      message: "Two transactions were not matched during the overnight sync.",
      type: "error",
      showInBell: true,
      time: "28 mins ago",
      actionLabel: "Investigate",
      actionPath: ROUTES.ADMIN_RECONCILIATION,
    },
  ]);

  const addNotification = useCallback((message, type = "info", duration = 3000, showInBell = true) => {
    const id = Date.now();
    const notification =
      typeof message === "object"
        ? { id, type, showInBell, ...message }
        : { id, title: "Notification", message, type, showInBell };

    setNotifications((prev) => [...prev, notification]);

    if (duration > 0 && !showInBell) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
