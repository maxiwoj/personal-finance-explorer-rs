'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFinanceDataProvider } from '@/contexts/data-provider-context'
import type { Transaction } from '@/lib/types'

export function useRecentTransactions() {
  const provider = useFinanceDataProvider()

  return useQuery<Transaction[]>({
    queryKey: ['recent-transactions', provider.mode],
    queryFn: provider.getRecentTransactions,
    staleTime: provider.mode === 'demo' ? Infinity : 5 * 60 * 1000,
  })
}

export function useFullTransactions() {
  const provider = useFinanceDataProvider()

  return useQuery<Transaction[]>({
    queryKey: ['full-transactions', provider.mode],
    queryFn: provider.getFullTransactions,
    staleTime: provider.mode === 'demo' ? Infinity : 10 * 60 * 1000,
  })
}

export function useReloadFinanceData() {
  const provider = useFinanceDataProvider()
  const queryClient = useQueryClient()

  return async () => {
    await provider.reloadData()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recent-transactions', provider.mode] }),
      queryClient.invalidateQueries({ queryKey: ['full-transactions', provider.mode] }),
    ])
  }
}
