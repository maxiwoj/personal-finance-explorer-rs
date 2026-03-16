'use client'

import type { Transaction } from '@/lib/types'
import { getCategoryColor } from '@/lib/colors'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar, CreditCard, Tag, FileText, Clock, Hash } from 'lucide-react'

interface TransactionDetailModalProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

function formatFullDateTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function TransactionDetailModal({ transaction, open, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Transaction Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Description */}
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base font-semibold">{transaction.what}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">
                {transaction.amountPLN.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
              </p>
              {transaction.currency !== 'PLN' && (
                <p className="text-sm text-muted-foreground">
                  Original: {transaction.amountOriginal.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {transaction.currency}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <span
                className="inline-block px-3 py-1 text-sm rounded-full text-white mt-1"
                style={{ backgroundColor: getCategoryColor(transaction.category) }}
              >
                {transaction.category}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-base">{formatDate(transaction.timestamp)}</p>
            </div>
          </div>

          {/* Full Timestamp */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Timestamp</p>
              <p className="text-base font-mono text-sm">{formatFullDateTime(transaction.timestamp)}</p>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="flex items-start gap-3">
            <Hash className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
              <p className="text-sm font-mono break-all">{transaction.transactionId}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
