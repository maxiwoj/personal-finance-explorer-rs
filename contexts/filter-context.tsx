'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface FilterState {
  selectedMonths: string[]
  selectedYears: string[]
  selectedCategories: string[]
  selectedDateRange: { start: string; end: string } | null
}

interface FilterContextType {
  filters: FilterState
  setSelectedMonths: (months: string[]) => void
  setSelectedYears: (years: string[]) => void
  setSelectedCategories: (categories: string[]) => void
  setSelectedDateRange: (range: { start: string; end: string } | null) => void
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
    selectedYears: [year],
    selectedCategories: [],
    selectedDateRange: null
  })

  const setSelectedMonths = useCallback((months: string[]) => {
    setFilters(prev => ({ ...prev, selectedMonths: months }))
  }, [])

  const setSelectedYears = useCallback((years: string[]) => {
    setFilters(prev => ({ ...prev, selectedYears: years }))
  }, [])

  const setSelectedCategories = useCallback((categories: string[]) => {
    setFilters(prev => ({ ...prev, selectedCategories: categories }))
  }, [])

  const setSelectedDateRange = useCallback((range: { start: string; end: string } | null) => {
    setFilters(prev => ({ ...prev, selectedDateRange: range }))
  }, [])

  const resetFilters = useCallback(() => {
    const { month, year } = getCurrentMonthYear()
    setFilters({
      selectedMonths: [month],
      selectedYears: [year],
      selectedCategories: [],
      selectedDateRange: null
    })
  }, [])

  return (
    <FilterContext.Provider value={{ 
      filters, 
      setSelectedMonths, 
      setSelectedYears, 
      setSelectedCategories,
      setSelectedDateRange,
      resetFilters 
    }}>
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
