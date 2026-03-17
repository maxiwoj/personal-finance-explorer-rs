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
  error: string | null
  signIn: () => void
  signOut: () => void
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
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenClient, setTokenClient] = useState<ReturnType<typeof window.google.accounts.oauth2.initTokenClient> | null>(null)
  const hasAttemptedSilent = useRef(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }

  const scheduleRefresh = (expiresInSeconds: number) => {
    clearRefreshTimer()
    // Refresh 5 minutes before expiration (or immediately if less than 5 mins left)
    const refreshDelay = Math.max(0, (expiresInSeconds - 300) * 1000)
    
    refreshTimerRef.current = setTimeout(() => {
      if (tokenClient) {
        const hint = localStorage.getItem(HINT_KEY) || undefined
        tokenClient.requestAccessToken({ prompt: 'none', hint })
      }
    }, refreshDelay)
  }

  // Initialize state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY)
    const storedExpiry = localStorage.getItem(EXPIRY_KEY)
    const storedHint = localStorage.getItem(HINT_KEY)

    if (storedToken && storedExpiry) {
      // If we have a token but no email hint, it's likely an old token 
      // without the new email scope. Clear it to force fresh consent.
      if (!storedHint) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EXPIRY_KEY)
        setIsLoading(false)
        return
      }

      const expiryTime = parseInt(storedExpiry, 10)
      const now = Date.now()
      
      if (now < expiryTime - 60000) {
        setAccessToken(storedToken)
        setIsLoading(false)
        // Schedule a refresh for the remaining time
        scheduleRefresh((expiryTime - now) / 1000)
      }
    }
  }, [tokenClient])

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
              // If silent login fails because of scope/consent issues, we just stop loading 
              // and let the user click "Sign In" manually to provide new consent.
              if (response.error === 'immediate_failed' || response.error === 'interaction_required') {
                console.log('Silent authentication failed, manual sign-in required.')
                // If we had a stored token but it's clearly not working with new scopes, clear it
                localStorage.removeItem(STORAGE_KEY)
                localStorage.removeItem(EXPIRY_KEY)
                localStorage.removeItem(HINT_KEY)
                setAccessToken(null)
              } else {
                setError(response.error === 'access_denied' ? 'Access denied. Please try again.' : response.error)
              }
              setIsLoading(false)
              return
            }

            if (response.access_token) {
              // Check if all scopes were granted
              if (window.google && !window.google.accounts.oauth2.hasGrantedAllScopes(response, REQUIRED_SCOPES)) {
                console.warn('Not all scopes were granted. This might cause the "insufficient scopes" error.')
              }
              
              setAccessToken(response.access_token)
              
              const expiresIn = response.expires_in || 3600
              const expiry = Date.now() + expiresIn * 1000
              localStorage.setItem(STORAGE_KEY, response.access_token)
              localStorage.setItem(EXPIRY_KEY, expiry.toString())
              
              // Fetch email for future hint
              try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` }
                })
                
                if (userInfoResponse.ok) {
                  const userInfo = await userInfoResponse.json()
                  if (userInfo.email) {
                    localStorage.setItem(HINT_KEY, userInfo.email)
                  }
                } else if (userInfoResponse.status === 403) {
                  // This happens if the token doesn't have the email scope
                  console.warn('Token has insufficient scopes for userinfo')
                  localStorage.removeItem(STORAGE_KEY)
                  localStorage.removeItem(EXPIRY_KEY)
                  setAccessToken(null)
                  setIsLoading(false)
                  return
                }
              } catch (e) {
                console.error('Failed to fetch user hint:', e)
              }

              scheduleRefresh(expiresIn)
              setError(null)
            }
            setIsLoading(false)
          },
        })
        setTokenClient(client)

        // Finalize loading state
        const storedToken = localStorage.getItem(STORAGE_KEY)
        const storedExpiry = localStorage.getItem(EXPIRY_KEY)
        const storedHint = localStorage.getItem(HINT_KEY)
        const isValid = storedToken && storedExpiry && storedHint && (parseInt(storedExpiry, 10) > Date.now() + 60000)

        // We don't attempt silent login on mount anymore because it triggers browser popup blockers.
        // Persistence is handled by localStorage for the duration of the token (1 hour).
        setIsLoading(false)
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
      clearRefreshTimer()
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
    // Force consent screen to ensure user can check all necessary boxes
    tokenClient.requestAccessToken({ prompt: 'consent' })
  }, [tokenClient])

  const signOut = useCallback(() => {
    const currentToken = accessToken || localStorage.getItem(STORAGE_KEY)
    
    clearRefreshTimer()
    if (currentToken && window.google) {
      window.google.accounts.oauth2.revoke(currentToken, () => {
        setAccessToken(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(EXPIRY_KEY)
        localStorage.removeItem(HINT_KEY)
      })
    } else {
      setAccessToken(null)
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
        error,
        signIn,
        signOut,
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
