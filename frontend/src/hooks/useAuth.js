import { useContext } from 'react'
import { AuthContext } from '../context/authContext'

export function useAuth() {
  const context = useContext(AuthContext)
  console.log('🪝 useAuth hook called, returning context:', context)
  return context
}
