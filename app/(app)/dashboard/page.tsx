'use client'

import { useRouter } from 'next/navigation'
import { useRecentTransactions } from '@/hooks/use-transactions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { PieChart } from '@/components/charts/pie-chart'
import { LineChart } from '@/components/charts/line-chart'
import { TransactionsTable } from '@/components/transactions-table'
import { getCategoryTotals, getCumulativeSpending, getCurrentMonthSpending } from '@/lib/analytics'
import { AlertCircle, TrendingUp, Wallet } from 'lucide-react'

export default function DashboardPage() {
  const { data: transactions, isLoading, error } = useRecentTransactions()
  const router = useRouter()

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

  const monthlySpending = getCurrentMonthSpending(transactions)
  const categoryTotals = getCategoryTotals(transactions)
  const cumulativeData = getCumulativeSpending(transactions)

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your recent spending overview</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Monthly Spending Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlySpending.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
            </div>
            <p className="text-xs text-muted-foreground">
              Current month spending
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
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent transactions loaded
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
            <CardDescription>Click a slice to view category details</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={pieData} onSliceClick={handleCategoryClick} height={350} />
          </CardContent>
        </Card>

        {/* Cumulative Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Spending</CardTitle>
            <CardDescription>Running total over time</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={lineData} height={350} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your last 20 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} limit={20} />
        </CardContent>
      </Card>
    </div>
  )
}
