'use client'

import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Transaction } from '@/lib/types'
import { useFilters } from '@/contexts/filter-context'

interface MonthYearFilterProps {
  transactions: Transaction[]
  className?: string
}

const ALL_VALUE = '__all__'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function MonthYearFilter({
  transactions,
  className = '',
}: MonthYearFilterProps) {
  const { filters, setSelectedMonths, setSelectedYears } = useFilters()
  const { selectedMonths, selectedYears } = filters

  const { availableYears, availableMonths } = useMemo(() => {
    const years = new Set<string>()
    const months = new Set<string>()
    
    transactions.forEach(t => {
      const [month, year] = t.monthYear.split('_')
      if (year) years.add(year)
      if (month) months.add(month)
    })
    
    return {
      availableYears: Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)),
      availableMonths: Array.from(months)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(m => ({ value: m, label: MONTH_NAMES[parseInt(m) - 1] || m }))
    }
  }, [transactions])

  const currentMonthValue = selectedMonths.length === 1 ? selectedMonths[0] : 
    selectedMonths.length === 0 ? ALL_VALUE : 'multiple'
  
  const currentYearValue = selectedYears.length === 1 ? selectedYears[0] : 
    selectedYears.length === 0 ? ALL_VALUE : 'multiple'

  const handleMonthChange = (value: string) => {
    if (value === ALL_VALUE) {
      setSelectedMonths([])
    } else {
      setSelectedMonths([value])
    }
  }

  const handleYearChange = (value: string) => {
    if (value === ALL_VALUE) {
      setSelectedYears([])
    } else {
      setSelectedYears([value])
    }
  }

  return (
    <>
      <Select value={currentYearValue} onValueChange={handleYearChange}>
        <SelectTrigger id="year-filter" className="w-[120px] h-9">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All years</SelectItem>
          {availableYears.map(year => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentMonthValue} onValueChange={handleMonthChange}>
        <SelectTrigger id="month-filter" className="w-[140px] h-9">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All months</SelectItem>
          {availableMonths.map(month => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

// Helper function to filter transactions by selected months and years
export function filterByMonthYear(
  transactions: Transaction[],
  selectedMonths: string[],
  selectedYears: string[]
): Transaction[] {
  return transactions.filter(t => {
    const [month, year] = t.monthYear.split('_')
    
    const monthMatch = selectedMonths.length === 0 || selectedMonths.includes(month)
    const yearMatch = selectedYears.length === 0 || selectedYears.includes(year)
    
    return monthMatch && yearMatch
  })
}

// Get current month and year as filter values
export function getCurrentMonthYear(): { month: string; year: string } {
  const now = new Date()
  return {
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear())
  }
}
