import React, { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

interface User {
  id: number
  username: string
  role: 'admin' | 'opj'
  grade?: string
  matricule?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await client.post('/auth/login', { username, password })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
