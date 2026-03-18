'use client'

import { useState } from 'react'
import type { Transaction } from '@/lib/types'
import { getCategoryColor } from '@/lib/colors'
import { TransactionDetailModal } from './transaction-detail-modal'

interface TransactionsTableProps {
  transactions: Transaction[]
  showCategory?: boolean
  limit?: number
}

function formatDateOnly(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function TransactionsTable({ transactions, showCategory = true, limit }: TransactionsTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const sorted = [...transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const displayed = limit ? sorted.slice(0, limit) : sorted

  return (
    <>
      <div className="overflow-hidden">
        <table className="hidden w-full text-sm md:table">
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
            {displayed.map((t, index) => (
              <tr
                key={`${t.transactionId}-${index}`}
                className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedTransaction(t)}
              >
                <td className="py-3 text-muted-foreground whitespace-nowrap">
                  {formatDateOnly(t.timestamp)}
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

        <div className="space-y-3 md:hidden">
          {displayed.map((t, index) => (
            <button
              key={`${t.transactionId}-${index}`}
              type="button"
              className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
              onClick={() => setSelectedTransaction(t)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {formatDateOnly(t.timestamp)}
                  </div>
                  <div className="break-words text-sm font-medium text-foreground">
                    {t.what}
                  </div>
                  {showCategory && (
                    <span
                      className="inline-flex max-w-full rounded-full px-2 py-1 text-xs text-white"
                      style={{ backgroundColor: getCategoryColor(t.category) }}
                    >
                      <span className="truncate">{t.category}</span>
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right text-sm font-semibold whitespace-nowrap">
                  {t.amountPLN.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
                </div>
              </div>
            </button>
          ))}
        </div>

        {displayed.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No transactions found</p>
        )}
      </div>

      <TransactionDetailModal
        transaction={selectedTransaction}
        open={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  )
}
