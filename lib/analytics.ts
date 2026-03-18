import type { Transaction, CategoryTotal, MonthlyTotal, DescriptionTotal } from './types'
import { getCategoryColor } from './colors'

export function getCategoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, number>()
  
  transactions.forEach(t => {
    const current = totals.get(t.category) || 0
    totals.set(t.category, current + t.amountPLN)
  })
  
  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.total - a.total)
}

export function getDescriptionTotals(transactions: Transaction[]): DescriptionTotal[] {
  const totals = new Map<string, number>()
  
  transactions.forEach(t => {
    const current = totals.get(t.what) || 0
    totals.set(t.what, current + t.amountPLN)
  })
  
  return Array.from(totals.entries())
    .map(([what, total]) => ({
      what,
      total: Math.round(total * 100) / 100
    }))
    .sort((a, b) => b.total - a.total)
}

export function getMonthlyTotals(transactions: Transaction[]): MonthlyTotal[] {
  const totals = new Map<string, { monthName: string; total: number }>()
  
  transactions.forEach(t => {
    const current = totals.get(t.monthYear)
    if (current) {
      current.total += t.amountPLN
    } else {
      totals.set(t.monthYear, { monthName: t.monthName, total: t.amountPLN })
    }
  })
  
  return Array.from(totals.entries())
    .map(([monthYear, data]) => ({
      monthYear,
      monthName: data.monthName,
      total: Math.round(data.total * 100) / 100
    }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.monthYear.split('_').map(Number)
      const [bMonth, bYear] = b.monthYear.split('_').map(Number)
      if (aYear !== bYear) return aYear - bYear
      return aMonth - bMonth
    })
}

export type TimeSeriesGranularity = 'day' | 'transaction'

export interface CumulativeSpendingPoint {
  key: string
  label: string
  timestamp: number
  total: number
  transactionName?: string
  transactionNames?: string[]
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function formatDayKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatTransactionKey(date: Date, transactionId: string): string {
  return `${date.toISOString()}__${transactionId}`
}

function formatDisplayLabel(date: Date, granularity: TimeSeriesGranularity): string {
  if (granularity === 'transaction') {
    return new Intl.DateTimeFormat('en-CA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  return formatDayKey(date)
}

export function getCumulativeSpending(
  transactions: Transaction[],
  granularity: TimeSeriesGranularity = 'day'
): CumulativeSpendingPoint[] {
  const sorted = [...transactions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  let cumulative = 0

  if (granularity === 'transaction') {
    return sorted.map(transaction => {
      cumulative += transaction.amountPLN
      return {
        key: formatTransactionKey(transaction.timestamp, transaction.transactionId),
        label: formatDisplayLabel(transaction.timestamp, granularity),
        timestamp: transaction.timestamp.getTime(),
        total: roundCurrency(cumulative),
        transactionName: transaction.what,
        transactionNames: [transaction.what],
      }
    })
  }

  const dailyTotals = new Map<string, CumulativeSpendingPoint>()

  sorted.forEach(transaction => {
    cumulative += transaction.amountPLN
    const key = formatDayKey(transaction.timestamp)
    const existing = dailyTotals.get(key)
    dailyTotals.set(key, {
      key,
      label: formatDisplayLabel(transaction.timestamp, granularity),
      timestamp: transaction.timestamp.getTime(),
      total: roundCurrency(cumulative),
      transactionNames: [...(existing?.transactionNames || []), transaction.what],
    })
  })

  return Array.from(dailyTotals.values()).sort((a, b) => a.timestamp - b.timestamp)
}

export function getCurrentMonthSpending(transactions: Transaction[]): number {
  const now = new Date()
  const currentMonthYear = `${now.getMonth() + 1}_${now.getFullYear()}`
  
  const total = transactions
    .filter(t => t.monthYear === currentMonthYear)
    .reduce((sum, t) => sum + t.amountPLN, 0)
  
  return Math.round(total * 100) / 100
}

export function filterTransactionsByCategory(transactions: Transaction[], category: string): Transaction[] {
  return transactions.filter(t => t.category.toLowerCase() === category.toLowerCase())
}

export function filterTransactions(
  transactions: Transaction[],
  filters: {
    category?: string
    monthYear?: string
    search?: string
  }
): Transaction[] {
  return transactions.filter(t => {
    if (filters.category && t.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false
    }
    if (filters.monthYear && t.monthYear !== filters.monthYear) {
      return false
    }
    if (filters.search && !t.what.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })
}
