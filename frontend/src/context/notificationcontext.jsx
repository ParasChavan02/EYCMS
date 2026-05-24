import { createContext, useState, useCallback } from 'react'

export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
})

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info', duration = 3000, showInBell = true) => {
    const id = Date.now()
    const notification = { id, message, type, showInBell }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto remove toast notifications after duration
    if (duration > 0 && !showInBell) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}
