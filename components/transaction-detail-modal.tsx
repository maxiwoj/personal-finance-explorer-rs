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
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-4 pb-2 border-b bg-muted/30">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Transaction Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Main Info: Amount & Description */}
          <div className="text-center space-y-1 pb-2 border-b border-dashed">
            <p className="text-3xl font-black tracking-tight">
              {transaction.amountPLN.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
              <span className="text-sm font-bold text-muted-foreground ml-1 uppercase">PLN</span>
            </p>
            <p className="text-base font-semibold text-foreground leading-tight">
              {transaction.what}
            </p>
            {transaction.currency !== 'PLN' && (
              <p className="text-xs font-medium text-muted-foreground bg-muted w-fit mx-auto px-2 py-0.5 rounded-full">
                Original: {transaction.amountOriginal.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {transaction.currency}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Category
              </p>
              <span
                className="inline-block px-2 py-0.5 text-xs font-bold rounded-md text-white shadow-sm"
                style={{ backgroundColor: getCategoryColor(transaction.category) }}
              >
                {transaction.category}
              </span>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                <Calendar className="h-3 w-3" /> Date
              </p>
              <p className="text-xs font-semibold">{formatDate(transaction.timestamp)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time
              </p>
              <p className="text-xs font-mono font-medium">{formatFullDateTime(transaction.timestamp).split(',')[1]}</p>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                <Hash className="h-3 w-3" /> ID
              </p>
              <p className="text-[10px] font-mono text-muted-foreground truncate" title={transaction.transactionId}>
                {transaction.transactionId.split('-').pop()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
