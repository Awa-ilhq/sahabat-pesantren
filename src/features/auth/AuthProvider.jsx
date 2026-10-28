import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../api'
import {
  clearSession,
  getSession,
  getToken,
  onSessionChange,
  onSessionExpired,
  setSession,
} from '../../lib/session'
import { AuthContext } from './auth-context'
import LoginCelebration from './LoginCelebration'

const CELEBRATION_MS = 1200

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession())
  const [celebrating, setCelebrating] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const store = useCallback((next) => {
    setSessionState(next)
    if (next) setSession(next)
    else clearSession()
  }, [])

  const login = useCallback(
    async (credentials) => {
      const result = await api.auth.login(credentials)
      store({ token: result.token, user: result.user })
      setCelebrating(true)
      window.setTimeout(() => setCelebrating(false), CELEBRATION_MS)
      return result.user
    },
    [store],
  )

  const logout = useCallback(() => {
    const token = getToken()
    store(null)
    queryClient.clear()
    void api.auth.logout(token).catch(() => {})
  }, [store, queryClient])

  const quickExit = useCallback(() => {
    const token = getToken()
    store(null)
    queryClient.clear()
    void api.auth.logout(token).catch(() => {})
    window.location.replace('/')
  }, [store, queryClient])

  const changePassword = useCallback(
    async (payload) => {
      await api.auth.changePassword(payload)
      const current = getSession()
      if (current) {
        const next = {
          ...current,
          user: { ...current.user, mustChangePassword: false },
        }
        setSessionState(next)
        setSession(next)
      }
    },
    [],
  )

  const updateProfile = useCallback(
    async (payload) => {
      const user = await api.auth.updateProfile(payload)
      const current = getSession()
      if (current) {
        const next = {
          ...current,
          user: { ...current.user, ...user },
        }
        setSessionState(next)
        setSession(next)
        return next.user
      }
      store({ token: current?.token, user })
      return user
    },
    [store],
  )

  useEffect(
    () =>
      onSessionExpired(() => {
        setSessionState(null)
        queryClient.clear()
        navigate('/login', {
          replace: true,
          state: { message: 'Sesi berakhir. Silakan masuk kembali.' },
        })
      }),
    [navigate, queryClient],
  )

  useEffect(() => {
    let previous = getSession()
    return onSessionChange((next) => {
      const previousUser = previous?.user?.id ?? null
      const nextUser = next?.user?.id ?? null
      if (previousUser && nextUser && previousUser !== nextUser) {
        queryClient.clear()
      }
      previous = next
      setSessionState(next)
      if (!next) {
        queryClient.clear()
        navigate('/login', {
          replace: true,
          state: { message: 'Sesi berakhir di tab lain. Silakan masuk kembali.' },
        })
      }
    })
  }, [navigate, queryClient])

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted && !getToken()) {
        navigate('/login', { replace: true })
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [navigate])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
      quickExit,
      changePassword,
      updateProfile,
    }),
    [session, login, logout, quickExit, changePassword, updateProfile],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {celebrating ? <LoginCelebration /> : null}
    </AuthContext.Provider>
  )
}
