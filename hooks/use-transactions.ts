'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { fetchRecentTransactions, fetchFullTransactions } from '@/lib/sheets'
import {
  getCachedRecentTransactions,
  setCachedRecentTransactions,
  getCachedFullTransactions,
  setCachedFullTransactions,
} from '@/lib/cache'
import type { Transaction } from '@/lib/types'

export function useRecentTransactions() {
  const { accessToken, isAuthenticated } = useAuth()

  return useQuery<Transaction[]>({
    queryKey: ['recent-transactions', accessToken],
    queryFn: async () => {
      // First try to get cached data
      const cached = await getCachedRecentTransactions()
      
      if (!accessToken) {
        if (cached) return cached
        throw new Error('Not authenticated')
      }

      // Fetch fresh data
      const fresh = await fetchRecentTransactions(accessToken)
      
      // Update cache
      await setCachedRecentTransactions(fresh)
      
      return fresh
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: () => {
      // Return cached data while fetching
      return undefined
    },
  })
}

export function useFullTransactions() {
  const { accessToken, isAuthenticated } = useAuth()

  return useQuery<Transaction[]>({
    queryKey: ['full-transactions', accessToken],
    queryFn: async () => {
      // First try to get cached data
      const cached = await getCachedFullTransactions()
      
      if (!accessToken) {
        if (cached) return cached
        throw new Error('Not authenticated')
      }

      // Fetch fresh data
      const fresh = await fetchFullTransactions(accessToken)
      
      // Update cache
      await setCachedFullTransactions(fresh)
      
      return fresh
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
