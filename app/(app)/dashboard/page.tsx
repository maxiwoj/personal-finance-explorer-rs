'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRecentTransactions } from '@/hooks/use-transactions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { PieChart } from '@/components/charts/pie-chart'
import { LineChart } from '@/components/charts/line-chart'
import { TransactionsTable } from '@/components/transactions-table'
import { MonthYearFilter, filterByMonthYear } from '@/components/month-year-filter'
import { CategoryFilter, filterByCategory } from '@/components/category-filter'
import { getCategoryTotals, getCumulativeSpending } from '@/lib/analytics'
import { useFilters } from '@/contexts/filter-context'
import { AlertCircle, RefreshCw, TrendingUp, Wallet } from 'lucide-react'

export default function DashboardPage() {
  const { data: transactions, isLoading, isFetching, error, refetch } = useRecentTransactions()
  const router = useRouter()
  const { filters, setSelectedCategories } = useFilters()
  const { selectedMonths, selectedYears, selectedCategories } = filters

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    let filtered = filterByMonthYear(transactions, selectedMonths, selectedYears)
    filtered = filterByCategory(filtered, selectedCategories)
    return filtered
  }, [transactions, selectedMonths, selectedYears, selectedCategories])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading your transactions...</p>
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

  const totalSpending = filteredTransactions.reduce((sum, t) => sum + t.amountPLN, 0)
  const categoryTotals = getCategoryTotals(filteredTransactions)
  const cumulativeData = getCumulativeSpending(filteredTransactions)

  const pieData = categoryTotals.map(c => ({
    name: c.category,
    value: c.total,
    color: c.color,
  }))

  const lineData = cumulativeData.map(d => ({
    label: d.date,
    value: d.total,
  }))

  const handleCategoryClick = (category: string) => {
    router.push(`/category/${encodeURIComponent(category)}`)
  }

  const handlePieSliceClick = (categoryName: string) => {
    // Toggle category filter when clicking pie slice
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryName))
    } else {
      setSelectedCategories([...selectedCategories, categoryName])
    }
  }

  const filterLabel = selectedMonths.length === 0 && selectedYears.length === 0
    ? 'All time'
    : `${selectedMonths.length === 0 ? 'All months' : ''} ${selectedYears.length === 1 ? selectedYears[0] : ''}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your spending overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Reloading...' : 'Reload data'}
          </Button>
          <CategoryFilter transactions={transactions} />
          <MonthYearFilter transactions={transactions} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Spending Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSpending.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
            </div>
            <p className="text-xs text-muted-foreground">
              {filterLabel.trim() || 'Selected period'}
            </p>
          </CardContent>
        </Card>

        {/* Total Transactions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Transactions in selected period
            </p>
          </CardContent>
        </Card>

        {/* Categories Count Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryTotals.length}</div>
            <p className="text-xs text-muted-foreground">
              Different spending categories
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Click a slice to filter by category</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <PieChart data={pieData} onSliceClick={handlePieSliceClick} height={350} />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No transactions in selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cumulative Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Spending</CardTitle>
            <CardDescription>Running total over time - use brush tool to select date range</CardDescription>
          </CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <LineChart 
                data={lineData} 
                height={350}
                onBrushSelect={(start, end) => {
                  // Could implement date range filtering here
                  console.log('Date range selected:', start, '-', end)
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No transactions in selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 20 transactions in selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={filteredTransactions} limit={20} />
        </CardContent>
      </Card>
    </div>
  )
}
