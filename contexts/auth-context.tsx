'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { GOOGLE_CLIENT_ID } from '@/lib/config'
import { clearCache } from '@/lib/cache'
import { clearStoredDemoTransactions } from '@/lib/demo-data'

const STORAGE_KEY = 'pfe_access_token'
const EXPIRY_KEY = 'pfe_token_expiry'
const HINT_KEY = 'pfe_email_hint'
const MODE_KEY = 'pfe_auth_mode'

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ')

export type AuthMode = 'google' | 'demo' | null

interface GoogleCodeClient {
  requestCode: () => void
}

interface AuthContextType {
  mode: AuthMode
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isExpiring: boolean
  expiryTime: number | null
  error: string | null
  signInWithGoogle: () => void
  enterDemoMode: () => void
  signOut: () => void
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string
            scope: string
            ux_mode?: 'popup' | 'redirect'
            redirect_uri?: string
            callback: (response: { code?: string; error?: string }) => void
          }) => GoogleCodeClient
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}

function clearGoogleSession() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(EXPIRY_KEY)
  localStorage.removeItem(HINT_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [expiryTime, setExpiryTime] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [codeClient, setCodeClient] = useState<GoogleCodeClient | null>(null)
  const [isExpiring, setIsExpiring] = useState(false)

  const handleAuthResponse = useCallback(async (data: { access_token: string, expiry_date: number }) => {
    setMode('google')
    setAccessToken(data.access_token)
    setExpiryTime(data.expiry_date)

    localStorage.setItem(MODE_KEY, 'google')
    localStorage.setItem(STORAGE_KEY, data.access_token)
    localStorage.setItem(EXPIRY_KEY, data.expiry_date.toString())

    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json()
        if (userInfo.email) {
          localStorage.setItem(HINT_KEY, userInfo.email)
        }
      }
    } catch (fetchError) {
      console.error('Failed to fetch user hint:', fetchError)
    }
    setError(null)
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        await handleAuthResponse(data)
        return true
      } else {
        // If refresh fails, clear everything
        clearGoogleSession()
        setAccessToken(null)
        setExpiryTime(null)
        setMode(null)
        localStorage.removeItem(MODE_KEY)
        return false
      }
    } catch (e) {
      console.error('Refresh error:', e)
      return false
    }
  }, [handleAuthResponse])

  useEffect(() => {
    if (!expiryTime || mode !== 'google') return

    const checkExpiry = () => {
      const remaining = expiryTime - Date.now()
      setIsExpiring(remaining > 0 && remaining < 600000)

      if (remaining <= 0 && accessToken) {
        // Try to refresh automatically
        void refreshSession()
      }
    }

    checkExpiry()
    const interval = setInterval(checkExpiry, 30000)
    return () => clearInterval(interval)
  }, [expiryTime, accessToken, mode, refreshSession])

  useEffect(() => {
    const onFocus = () => {
      if (mode === 'google' && expiryTime && expiryTime <= Date.now() && accessToken) {
        void refreshSession()
      }
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [expiryTime, accessToken, mode, refreshSession])

  useEffect(() => {
    const init = async () => {
      const storedMode = localStorage.getItem(MODE_KEY) as AuthMode
      const storedToken = localStorage.getItem(STORAGE_KEY)
      const storedExpiry = localStorage.getItem(EXPIRY_KEY)

      if (storedMode === 'demo') {
        setMode('demo')
        setIsLoading(false)
        return
      }

      if (storedMode === 'google') {
        // Check if current token is still valid
        if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry, 10) - 60000) {
          setMode('google')
          setAccessToken(storedToken)
          setExpiryTime(parseInt(storedExpiry, 10))
          setIsLoading(false)
        } else {
          // Try to refresh
          const success = await refreshSession()
          if (!success) {
            clearGoogleSession()
            localStorage.removeItem(MODE_KEY)
          }
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
    void init()
  }, [refreshSession])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: REQUIRED_SCOPES,
          ux_mode: 'popup',
          // @ts-ignore - access_type is supported but might be missing in some type definitions
          access_type: 'offline',
          callback: async (response) => {
            if (response.error) {
              setError(response.error === 'access_denied' ? 'Access denied. Please try again.' : response.error)
              setIsLoading(false)
              return
            }

            if (response.code) {
              setIsLoading(true)
              try {
                const loginResponse = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: response.code }),
                })

                if (loginResponse.ok) {
                  const data = await loginResponse.json()
                  await handleAuthResponse(data)
                } else {
                  const err = await loginResponse.json()
                  setError(err.error || 'Login failed')
                }
              } catch (e) {
                console.error('Login error:', e)
                setError('Failed to connect to authentication server')
              }
              setIsLoading(false)
            }
          },
        })
        setCodeClient(client)
      }
    }
    script.onerror = () => {
      setError('Failed to load Google authentication')
      setIsLoading(false)
    }
    document.body.appendChild(script)

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [handleAuthResponse])

  const signInWithGoogle = useCallback(() => {
    if (!codeClient) {
      setError('Authentication not ready. Please try again.')
      return
    }

    setError(null)
    try {
      codeClient.requestCode()
    } catch (signInError) {
      console.error('Sign-in failed to trigger:', signInError)
      setError('Authentication failed to start. Please check if popups are blocked.')
    }
  }, [codeClient])

  const enterDemoMode = useCallback(() => {
    clearGoogleSession()
    void clearCache()
    setAccessToken(null)
    setExpiryTime(null)
    setIsExpiring(false)
    setError(null)
    setMode('demo')
    localStorage.setItem(MODE_KEY, 'demo')
  }, [])

  const signOut = useCallback(async () => {
    const activeMode = mode ?? (localStorage.getItem(MODE_KEY) as AuthMode)
    const currentToken = accessToken || localStorage.getItem(STORAGE_KEY)

    if (activeMode === 'demo') {
      clearStoredDemoTransactions()
    }

    if (activeMode === 'google') {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch (e) {
        console.error('Logout error:', e)
      }
    }

    void clearCache()
    setMode(null)
    setAccessToken(null)
    setExpiryTime(null)
    setIsExpiring(false)
    setError(null)
    localStorage.removeItem(MODE_KEY)
    clearGoogleSession()

    if (activeMode === 'google' && currentToken && window.google) {
      window.google.accounts.oauth2.revoke(currentToken, () => undefined)
    }
  }, [accessToken, mode])

  return (
    <AuthContext.Provider
      value={{
        mode,
        accessToken,
        isAuthenticated: mode === 'demo' || !!accessToken,
        isLoading,
        isExpiring,
        expiryTime,
        error,
        signInWithGoogle,
        enterDemoMode,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
