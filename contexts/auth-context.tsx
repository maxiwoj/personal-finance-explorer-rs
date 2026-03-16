'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '@/lib/config'

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
            callback: (response: { access_token?: string; error?: string }) => void
          }) => {
            requestAccessToken: () => void
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
          scope: GOOGLE_SCOPES,
          callback: (response) => {
            if (response.error) {
              setError(response.error === 'access_denied' ? 'Access denied. Please try again.' : response.error)
              setIsLoading(false)
              return
            }
            if (response.access_token) {
              setAccessToken(response.access_token)
              setError(null)
            }
            setIsLoading(false)
          },
        })
        setTokenClient(client)
      }
      setIsLoading(false)
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
    tokenClient.requestAccessToken()
  }, [tokenClient])

  const signOut = useCallback(() => {
    if (accessToken && window.google) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null)
      })
    } else {
      setAccessToken(null)
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
