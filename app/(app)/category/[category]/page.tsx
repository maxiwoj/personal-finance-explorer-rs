'use client'

import { use } from 'react'
import Link from 'next/link'
import { useFullTransactions } from '@/hooks/use-transactions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PieChart } from '@/components/charts/pie-chart'
import { LineChart } from '@/components/charts/line-chart'
import { TransactionsTable } from '@/components/transactions-table'
import { filterTransactionsByCategory, getDescriptionTotals, getMonthlyTotals } from '@/lib/analytics'
import { getCategoryColor } from '@/lib/colors'
import { AlertCircle, ArrowLeft } from 'lucide-react'

interface CategoryPageProps {
  params: Promise<{ category: string }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category: encodedCategory } = use(params)
  const category = decodeURIComponent(encodedCategory)
  const { data: transactions, isLoading, error } = useFullTransactions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading category data...</p>
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
        <p className="text-muted-foreground">No transactions found.</p>
      </div>
    )
  }

  const categoryTransactions = filterTransactionsByCategory(transactions, category)
  
  if (categoryTransactions.length === 0) {
    return (
      <div className="space-y-6">
        <Link href="/categories">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>
        </Link>
        <div className="text-center py-20">
          <p className="text-muted-foreground">No transactions found for category: {category}</p>
        </div>
      </div>
    )
  }

  const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amountPLN, 0)
  const descriptionTotals = getDescriptionTotals(categoryTransactions)
  const monthlyTotals = getMonthlyTotals(categoryTransactions)
  const categoryColor = getCategoryColor(category)

  // Pie chart data for top descriptions
  const topDescriptions = descriptionTotals.slice(0, 10)
  const otherTotal = descriptionTotals.slice(10).reduce((sum, d) => sum + d.total, 0)
  
  const pieData = [
    ...topDescriptions.map(d => ({
      name: d.what,
      value: d.total,
    })),
    ...(otherTotal > 0 ? [{ name: 'Other', value: otherTotal }] : [])
  ]

  const lineData = monthlyTotals.map(m => ({
    label: m.monthName,
    value: m.total,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/categories">
          <Button variant="ghost" size="sm" className="gap-2 w-fit">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: categoryColor }}
          />
          <div>
            <h1 className="text-3xl font-bold capitalize">{category}</h1>
            <p className="text-muted-foreground">
              {totalSpent.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN total across {categoryTransactions.length} transactions
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Description Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Description</CardTitle>
            <CardDescription>Top items in this category</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={pieData} height={350} />
          </CardContent>
        </Card>

        {/* Monthly Time Series */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
            <CardDescription>Spending over time in this category</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={lineData} 
              height={350} 
              color={categoryColor}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>{categoryTransactions.length} transactions in this category</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={categoryTransactions} showCategory={false} />
        </CardContent>
      </Card>
    </div>
  )
}
