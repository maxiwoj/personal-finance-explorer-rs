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

export function getCumulativeSpending(transactions: Transaction[]): { date: string; total: number; timestamp: number }[] {
  // Sort by timestamp ascending
  const sorted = [...transactions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  // Aggregate by date to avoid duplicate x-axis labels
  const dailyTotals = new Map<string, { date: string; total: number; timestamp: number }>()
  
  let cumulative = 0
  sorted.forEach(t => {
    cumulative += t.amountPLN
    const dateStr = t.timestamp.toLocaleDateString('en-GB')
    dailyTotals.set(dateStr, {
      date: dateStr,
      total: Math.round(cumulative * 100) / 100,
      timestamp: t.timestamp.getTime()
    })
  })
  
  // Return sorted by timestamp
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
