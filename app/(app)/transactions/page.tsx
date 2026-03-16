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
import { filterTransactions, getCategoryTotals, getMonthlyTotals } from '@/lib/analytics'
import { AlertCircle, Search, X } from 'lucide-react'

const ALL_VALUE = '__all__'

export default function TransactionsPage() {
  const { data: transactions, isLoading, error } = useFullTransactions()
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_VALUE)
  const [monthFilter, setMonthFilter] = useState<string>(ALL_VALUE)
  const [searchQuery, setSearchQuery] = useState('')

  const categories = useMemo(() => {
    if (!transactions) return []
    return getCategoryTotals(transactions).map(c => c.category)
  }, [transactions])

  const months = useMemo(() => {
    if (!transactions) return []
    return getMonthlyTotals(transactions).map(m => ({
      value: m.monthYear,
      label: m.monthName,
    }))
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return filterTransactions(transactions, {
      category: categoryFilter === ALL_VALUE ? undefined : categoryFilter,
      monthYear: monthFilter === ALL_VALUE ? undefined : monthFilter,
      search: searchQuery || undefined,
    })
  }, [transactions, categoryFilter, monthFilter, searchQuery])

  const clearFilters = () => {
    setCategoryFilter(ALL_VALUE)
    setMonthFilter(ALL_VALUE)
    setSearchQuery('')
  }

  const hasActiveFilters = categoryFilter !== ALL_VALUE || monthFilter !== ALL_VALUE || searchQuery !== ''

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
                Clear filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

            {/* Month Filter */}
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
