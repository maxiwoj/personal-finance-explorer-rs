'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { clearCache, clearFullTransactionsCache, clearRecentTransactionsCache, getCachedFullTransactions, getCachedRecentTransactions, setCachedFullTransactions, setCachedRecentTransactions } from '@/lib/cache'
import { getOrCreateDemoTransactions } from '@/lib/demo-data'
import { fetchFullTransactions, fetchRecentTransactions, SheetsApiError } from '@/lib/sheets'
import type { FinanceDataScope } from '@/hooks/use-transactions'
import type { Transaction } from '@/lib/types'

export type DataMode = 'google' | 'demo'

export interface FinanceDataProvider {
  mode: DataMode
  getRecentTransactions: () => Promise<Transaction[]>
  getFullTransactions: () => Promise<Transaction[]>
  reloadData: (scope?: FinanceDataScope) => Promise<void>
}

const DataProviderContext = createContext<FinanceDataProvider | null>(null)

function buildGoogleProvider(accessToken: string | null, refreshSession: () => Promise<boolean>): FinanceDataProvider {
  const fetchWithRefresh = async (
    currentToken: string | null,
    fetcher: (token: string) => Promise<Transaction[]>
  ) => {
    if (!currentToken) {
      throw new Error('Not authenticated')
    }

    try {
      return await fetcher(currentToken)
    } catch (error) {
      if (!(error instanceof SheetsApiError) || error.status !== 401) {
        throw error
      }

      const refreshed = await refreshSession()
      if (!refreshed) {
        throw new Error('Session expired')
      }

      const nextToken = localStorage.getItem('pfe_access_token')
      if (!nextToken) {
        throw new Error('Not authenticated')
      }

      return fetcher(nextToken)
    }
  }

  return {
    mode: 'google',
    async getRecentTransactions() {
      const cached = await getCachedRecentTransactions()

      if (!accessToken) {
        if (cached) return cached
        throw new Error('Not authenticated')
      }

      const fresh = await fetchWithRefresh(accessToken, fetchRecentTransactions)
      await setCachedRecentTransactions(fresh)
      return fresh
    },
    async getFullTransactions() {
      const cached = await getCachedFullTransactions()

      if (!accessToken) {
        if (cached) return cached
        throw new Error('Not authenticated')
      }

      const fresh = await fetchWithRefresh(accessToken, fetchFullTransactions)
      await setCachedFullTransactions(fresh)
      return fresh
    },
    async reloadData(scope = 'all') {
      if (scope === 'recent') {
        await clearRecentTransactionsCache()
        return
      }

      if (scope === 'full') {
        await clearFullTransactionsCache()
        return
      }

      await clearCache()
    },
  }
}

function buildDemoProvider(): FinanceDataProvider {
  const loadTransactions = async () => getOrCreateDemoTransactions()

  return {
    mode: 'demo',
    async getRecentTransactions() {
      const allTransactions = await loadTransactions()
      return allTransactions.slice(0, 90)
    },
    async getFullTransactions() {
      return loadTransactions()
    },
    async reloadData() {
      await getOrCreateDemoTransactions(true)
    },
  }
}

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const { mode, accessToken, refreshSession } = useAuth()

  const provider = useMemo(() => {
    if (mode === 'demo') {
      return buildDemoProvider()
    }

    return buildGoogleProvider(accessToken, refreshSession)
  }, [accessToken, mode, refreshSession])

  return <DataProviderContext.Provider value={provider}>{children}</DataProviderContext.Provider>
}

export function useFinanceDataProvider() {
  const context = useContext(DataProviderContext)

  if (!context) {
    throw new Error('useFinanceDataProvider must be used within a FinanceDataProvider')
  }

  return context
}
