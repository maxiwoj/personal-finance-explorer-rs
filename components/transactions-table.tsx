'use client'

import type { Transaction } from '@/lib/types'
import { getCategoryColor } from '@/lib/colors'

interface TransactionsTableProps {
  transactions: Transaction[]
  showCategory?: boolean
  limit?: number
}

export function TransactionsTable({ transactions, showCategory = true, limit }: TransactionsTableProps) {
  const sorted = [...transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const displayed = limit ? sorted.slice(0, limit) : sorted

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 font-medium text-muted-foreground">Date</th>
            <th className="pb-3 font-medium text-muted-foreground">Description</th>
            {showCategory && (
              <th className="pb-3 font-medium text-muted-foreground">Category</th>
            )}
            <th className="pb-3 font-medium text-muted-foreground text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((t, i) => (
            <tr key={`${t.timestamp.getTime()}-${t.what}-${i}`} className="border-b last:border-0">
              <td className="py-3 text-muted-foreground whitespace-nowrap">
                {t.timestamp.toLocaleDateString('en-GB')}
              </td>
              <td className="py-3 max-w-[200px] truncate" title={t.what}>
                {t.what}
              </td>
              {showCategory && (
                <td className="py-3">
                  <span
                    className="inline-block px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: getCategoryColor(t.category) }}
                  >
                    {t.category}
                  </span>
                </td>
              )}
              <td className="py-3 text-right font-medium whitespace-nowrap">
                {t.amountPLN.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {displayed.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No transactions found</p>
      )}
    </div>
  )
}
