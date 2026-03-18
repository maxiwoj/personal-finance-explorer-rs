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

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string; hint?: string }) => void
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
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void
          }) => GoogleTokenClient
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
  const [tokenClient, setTokenClient] = useState<GoogleTokenClient | null>(null)
  const [isExpiring, setIsExpiring] = useState(false)

  useEffect(() => {
    if (!expiryTime || mode !== 'google') return

    const checkExpiry = () => {
      const remaining = expiryTime - Date.now()
      setIsExpiring(remaining > 0 && remaining < 600000)

      if (remaining <= 0 && accessToken) {
        setAccessToken(null)
        setMode(null)
        localStorage.removeItem(MODE_KEY)
        clearGoogleSession()
      }
    }

    checkExpiry()
    const interval = setInterval(checkExpiry, 30000)
    return () => clearInterval(interval)
  }, [expiryTime, accessToken, mode])

  useEffect(() => {
    const onFocus = () => {
      if (mode === 'google' && expiryTime && expiryTime <= Date.now() && accessToken) {
        setAccessToken(null)
        setMode(null)
        localStorage.removeItem(MODE_KEY)
        clearGoogleSession()
      }
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [expiryTime, accessToken, mode])

  useEffect(() => {
    const storedMode = localStorage.getItem(MODE_KEY) as AuthMode
    const storedToken = localStorage.getItem(STORAGE_KEY)
    const storedExpiry = localStorage.getItem(EXPIRY_KEY)
    const storedHint = localStorage.getItem(HINT_KEY)

    if (storedMode === 'demo') {
      setMode('demo')
      setIsLoading(false)
      return
    }

    if (storedMode === 'google' && storedToken && storedExpiry) {
      if (!storedHint) {
        clearGoogleSession()
        localStorage.removeItem(MODE_KEY)
        setIsLoading(false)
        return
      }

      const expiry = parseInt(storedExpiry, 10)
      if (Date.now() < expiry - 60000) {
        setMode('google')
        setAccessToken(storedToken)
        setExpiryTime(expiry)
      } else {
        clearGoogleSession()
        localStorage.removeItem(MODE_KEY)
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: REQUIRED_SCOPES,
          callback: async (response) => {
            if (response.error) {
              if (response.error === 'immediate_failed' || response.error === 'interaction_required') {
                clearGoogleSession()
                setAccessToken(null)
                setExpiryTime(null)
                setMode(null)
                localStorage.removeItem(MODE_KEY)
              } else {
                setError(response.error === 'access_denied' ? 'Access denied. Please try again.' : response.error)
              }
              setIsLoading(false)
              return
            }

            if (response.access_token) {
              setMode('google')
              setAccessToken(response.access_token)

              const expiresIn = response.expires_in || 3600
              const expiry = Date.now() + expiresIn * 1000
              setExpiryTime(expiry)

              localStorage.setItem(MODE_KEY, 'google')
              localStorage.setItem(STORAGE_KEY, response.access_token)
              localStorage.setItem(EXPIRY_KEY, expiry.toString())

              try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` },
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
            }
            setIsLoading(false)
          },
        })
        setTokenClient(client)
      } else {
        setIsLoading(false)
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
  }, [])

  const signInWithGoogle = useCallback(() => {
    if (!tokenClient) {
      setError('Authentication not ready. Please try again.')
      return
    }

    setError(null)
    try {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } catch (signInError) {
      console.error('Sign-in failed to trigger:', signInError)
      setError('Authentication failed to start. Please check if popups are blocked.')
    }
  }, [tokenClient])

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

  const refreshSession = useCallback(() => {
    if (mode !== 'google' || !tokenClient) return

    setError(null)
    try {
      const hint = localStorage.getItem(HINT_KEY) || undefined
      tokenClient.requestAccessToken({ prompt: 'none', hint })
    } catch (refreshError) {
      console.error('Refresh failed to trigger:', refreshError)
    }
  }, [mode, tokenClient])

  const signOut = useCallback(() => {
    const activeMode = mode ?? (localStorage.getItem(MODE_KEY) as AuthMode)
    const currentToken = accessToken || localStorage.getItem(STORAGE_KEY)

    if (activeMode === 'demo') {
      clearStoredDemoTransactions()
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
