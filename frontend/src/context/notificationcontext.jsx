import { createContext, useCallback, useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("current_user");
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


export const NotificationContext = createContext({
  notifications: [],
  toasts: [],
  addNotification: () => {},
  removeNotification: () => {},
  refreshNotifications: () => {},
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const tokenRef = useRef(localStorage.getItem("token"));

  // Fetch notifications from FastAPI backend
  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const response = await api.get("/notifications");
      if (response.data && response.data.data) {
        const newNotifications = response.data.data;
        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications from backend:", error);
    }
  }, []);

  // Sync notifications on mount and set up polling interval (every 10s)
  useEffect(() => {
    refreshNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, 10000);

    // Listen for storage changes to handle login/logout token changes
    const handleStorage = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== tokenRef.current) {
        tokenRef.current = currentToken;
        refreshNotifications();
      }
    };
    window.addEventListener("storage", handleStorage);
    
    // Custom event to trigger immediate refreshes on actions
    window.addEventListener("refresh-notifications", refreshNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("refresh-notifications", refreshNotifications);
    };
  }, [refreshNotifications]);

  const addNotification = useCallback((message, type = "info", duration = 1800, showInBell = false) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const payloadMessage = typeof message === "object" ? message.message : message;
    const payloadTitle = typeof message === "object" ? message.title : "Notification";
    const actionPath = typeof message === "object" ? message.actionPath : null;
    const actionLabel = typeof message === "object" ? message.actionLabel : null;

    const newNotification = {
      id,
      title: payloadTitle,
      message: payloadMessage,
      type,
      showInBell,
      isToast: true,
      time: "Just now",
      actionPath,
      actionLabel
    };

    // Always add to toasts for real-time visual popup
    setToasts((prev) => [newNotification, ...prev]);

    // If it's a persistent notification for bell, save to DB
    if (showInBell && localStorage.getItem("token")) {
      api.post("/user/actions/trigger", {
        action_type: "client_toast",
        title: payloadTitle,
        message: payloadMessage,
        notification_type: type,
        action_path: actionPath,
        action_label: actionLabel
      }).then(() => {
        refreshNotifications();
      }).catch((err) => {
        console.error("Failed to persist notification to DB:", err);
      });
    }

    // Auto-dismiss popup after duration (default 1.8 seconds)
    const dismissTime = duration > 0 ? duration : 1800;
    setTimeout(() => {
      setToasts((prev) => prev.filter((n) => n.id !== id));
    }, dismissTime);

    return id;
  }, [refreshNotifications]);

  const removeNotification = useCallback(async (id) => {
    // Remove locally from toasts and notifications
    setToasts((prev) => prev.filter((n) => n.id !== id));
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // Delete from backend database if it's a stored notification
    const token = localStorage.getItem("token");
    if (token && isNaN(Number(id))) {
      try {
        await api.delete(`/notifications/${id}`);
      } catch (error) {
        console.error("Failed to delete notification from DB:", error);
      }
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, toasts, addNotification, removeNotification, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}
