import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext({
  user: null,
  signIn: () => {},
  signOut: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // Load user from localStorage on mount
  useEffect(() => {
    console.log('📦 AuthProvider mounting, checking localStorage...')
    const savedUser = localStorage.getItem('current_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        console.log('📦 Loaded user from localStorage:', userData)
        setUser(userData)
      } catch (e) {
        console.error('📦 Failed to parse saved user:', e)
      }
    }
  }, [])

  const signIn = (userData) => {
    console.log('🎯 AuthContext.signIn called with:', userData)
    setUser(userData)
    console.log('✅ User state set to:', userData)
  }
  const signOut = () => {
    console.log('🚪 AuthContext.signOut called')
    setUser(null)
    localStorage.removeItem('current_user')
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
