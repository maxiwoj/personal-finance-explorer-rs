'use client'

import { useState, useMemo } from 'react'
import { useFullTransactions } from '@/hooks/use-transactions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { TransactionsTable } from '@/components/transactions-table'
import { MonthYearFilter, filterByMonthYear } from '@/components/month-year-filter'
import { DateRangeFilter, filterByDateRange } from '@/components/date-range-filter'
import { getCategoryTotals } from '@/lib/analytics'
import { useFilters } from '@/contexts/filter-context'
import { AlertCircle, Search, X } from 'lucide-react'

const ALL_VALUE = '__all__'

export default function TransactionsPage() {
  const { data: transactions, isLoading, error } = useFullTransactions()
  const { filters, resetFilters } = useFilters()
  const { selectedMonths, selectedYears, selectedDateRange } = filters
  
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_VALUE)
  const [searchQuery, setSearchQuery] = useState('')

  const categories = useMemo(() => {
    if (!transactions) return []
    return getCategoryTotals(transactions).map(c => c.category)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    
    // First filter by month/year (only if date range is not set, or combining them? 
    // Usually date range is more specific. Let's make them work together or prioritize date range if set.
    // User requested "add filtering from-to". If set, it should probably override or narrow down.)
    
    let filtered = transactions

    if (selectedDateRange) {
      filtered = filterByDateRange(filtered, selectedDateRange)
    } else {
      filtered = filterByMonthYear(filtered, selectedMonths, selectedYears)
    }
    
    // Then by category
    if (categoryFilter !== ALL_VALUE) {
      filtered = filtered.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase())
    }
    
    // Then by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => t.what.toLowerCase().includes(query))
    }
    
    return filtered
  }, [transactions, selectedMonths, selectedYears, selectedDateRange, categoryFilter, searchQuery])

  const currentMonth = String(new Date().getMonth() + 1)
  const currentYear = String(new Date().getFullYear())

  const clearFilters = () => {
    resetFilters()
    setCategoryFilter(ALL_VALUE)
    setSearchQuery('')
  }

  const hasActiveFilters = categoryFilter !== ALL_VALUE || searchQuery !== '' ||
    selectedDateRange !== null ||
    selectedMonths.length !== 1 || selectedYears.length !== 1 ||
    selectedMonths[0] !== currentMonth || selectedYears[0] !== currentYear

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading all transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load transactions. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No transactions found in your spreadsheet.</p>
      </div>
    )
  }

  const totalFiltered = filteredTransactions.reduce((sum, t) => sum + t.amountPLN, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          Browse and filter all {transactions.length} transactions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Reset filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Month/Year Filter */}
              <MonthYearFilter transactions={transactions} />
              
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date range</Label>
                <DateRangeFilter />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search description</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>All categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transactions totaling{' '}
            {totalFiltered.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={filteredTransactions} />
        </CardContent>
      </Card>
    </div>
  )
}
