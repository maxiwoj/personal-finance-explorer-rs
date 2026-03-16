'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface FilterState {
  selectedMonths: string[]
  selectedYears: string[]
}

interface FilterContextType {
  filters: FilterState
  setSelectedMonths: (months: string[]) => void
  setSelectedYears: (years: string[]) => void
  resetFilters: () => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

// Get current month and year
function getCurrentMonthYear() {
  const now = new Date()
  return {
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear())
  }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const { month, year } = getCurrentMonthYear()
  
  const [filters, setFilters] = useState<FilterState>({
    selectedMonths: [month],
    selectedYears: [year]
  })

  const setSelectedMonths = useCallback((months: string[]) => {
    setFilters(prev => ({ ...prev, selectedMonths: months }))
  }, [])

  const setSelectedYears = useCallback((years: string[]) => {
    setFilters(prev => ({ ...prev, selectedYears: years }))
  }, [])

  const resetFilters = useCallback(() => {
    const { month, year } = getCurrentMonthYear()
    setFilters({
      selectedMonths: [month],
      selectedYears: [year]
    })
  }, [])

  return (
    <FilterContext.Provider value={{ filters, setSelectedMonths, setSelectedYears, resetFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}
