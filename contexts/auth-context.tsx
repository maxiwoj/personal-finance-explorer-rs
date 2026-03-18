'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '@/lib/config'

const STORAGE_KEY = 'pfe_access_token'
const EXPIRY_KEY = 'pfe_token_expiry'
const HINT_KEY = 'pfe_email_hint'

// Required scopes for the application
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
].join(' ')

interface AuthContextType {
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isExpiring: boolean
  expiryTime: number | null
  error: string | null
  signIn: () => void
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
          }) => {
            requestAccessToken: (options?: { prompt?: string; hint?: string }) => void
          }
          hasGrantedAllScopes: (response: any, scope: string) => boolean
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [expiryTime, setExpiryTime] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenClient, setTokenClient] = useState<ReturnType<typeof window.google.accounts.oauth2.initTokenClient> | null>(null)
  const [isExpiring, setIsExpiring] = useState(false)

  // Check if token is expiring (less than 10 minutes left)
  useEffect(() => {
    if (!expiryTime) return

    const checkExpiry = () => {
      const remaining = expiryTime - Date.now()
      setIsExpiring(remaining > 0 && remaining < 600000) // 10 minutes
      
      if (remaining <= 0 && accessToken) {
        // Token actually expired
        setAccessToken(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EXPIRY_KEY)
      }
    }

    checkExpiry()
    const interval = setInterval(checkExpiry, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [expiryTime, accessToken])

  // Check session on window focus
  useEffect(() => {
    const onFocus = () => {
      if (expiryTime && expiryTime <= Date.now() && accessToken) {
        setAccessToken(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EXPIRY_KEY)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [expiryTime, accessToken])

  // Initialize state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY)
    const storedExpiry = localStorage.getItem(EXPIRY_KEY)
    const storedHint = localStorage.getItem(HINT_KEY)

    if (storedToken && storedExpiry) {
      if (!storedHint) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EXPIRY_KEY)
        setIsLoading(false)
        return
      }

      const expiry = parseInt(storedExpiry, 10)
      if (Date.now() < expiry - 60000) {
        setAccessToken(storedToken)
        setExpiryTime(expiry)
      } else {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EXPIRY_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Load Google Identity Services script
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
                console.log('Silent authentication failed, manual sign-in required.')
                localStorage.removeItem(STORAGE_KEY)
                localStorage.removeItem(EXPIRY_KEY)
                setAccessToken(null)
                setExpiryTime(null)
              } else {
                setError(response.error === 'access_denied' ? 'Access denied. Please try again.' : response.error)
              }
              setIsLoading(false)
              return
            }

            if (response.access_token) {
              setAccessToken(response.access_token)
              
              const expiresIn = response.expires_in || 3600
              const expiry = Date.now() + expiresIn * 1000
              setExpiryTime(expiry)
              
              localStorage.setItem(STORAGE_KEY, response.access_token)
              localStorage.setItem(EXPIRY_KEY, expiry.toString())
              
              try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` }
                })
                
                if (userInfoResponse.ok) {
                  const userInfo = await userInfoResponse.json()
                  if (userInfo.email) {
                    localStorage.setItem(HINT_KEY, userInfo.email)
                  }
                }
              } catch (e) {
                console.error('Failed to fetch user hint:', e)
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

  const signIn = useCallback(() => {
    if (!tokenClient) {
      setError('Authentication not ready. Please try again.')
      return
    }
    setError(null)
    try {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } catch (e) {
      console.error('Sign-in failed to trigger:', e)
      setError('Authentication failed to start. Please check if popups are blocked.')
    }
  }, [tokenClient])

  const refreshSession = useCallback(() => {
    if (!tokenClient) return
    setError(null)
    try {
      const hint = localStorage.getItem(HINT_KEY) || undefined
      // Try with prompt: none first, but since this is usually called by user action, 
      // it might work better if we used 'select_account' or similar if blocked.
      // But for "on-demand", let's try 'none' first.
      tokenClient.requestAccessToken({ prompt: 'none', hint })
    } catch (e) {
      console.error('Refresh failed to trigger:', e)
      // If none fails, we'll let the user click sign-in again
    }
  }, [tokenClient])

  const signOut = useCallback(() => {
    const currentToken = accessToken || localStorage.getItem(STORAGE_KEY)
    
    if (currentToken && window.google) {
      window.google.accounts.oauth2.revoke(currentToken, () => {
        setAccessToken(null)
        setExpiryTime(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EXPIRY_KEY)
        localStorage.removeItem(HINT_KEY)
      })
    } else {
      setAccessToken(null)
      setExpiryTime(null)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(EXPIRY_KEY)
      localStorage.removeItem(HINT_KEY)
    }
  }, [accessToken])

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        isExpiring,
        expiryTime,
        error,
        signIn,
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
