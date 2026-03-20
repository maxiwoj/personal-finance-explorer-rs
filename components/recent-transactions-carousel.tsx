'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Wallet, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface RecentTransactionsCarouselProps {
  transactions: Transaction[]
  className?: string
  limit?: number
}

export function RecentTransactionsCarousel({
  transactions,
  className,
  limit = 3,
}: RecentTransactionsCarouselProps) {
  // Take the most recent transactions based on the limit
  const recentTransactions = React.useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }, [transactions, limit])

  if (recentTransactions.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          Recent Activity
        </h2>
        <Link 
          href="#recent-transactions" 
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {recentTransactions.map((transaction) => (
            <CarouselItem 
              key={transaction.transactionId} 
              className="pl-2 md:pl-4 basis-[85%] sm:basis-[45%] lg:basis-[33%]"
            >
              <Card className="border-none bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {transaction.what}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal bg-background/50">
                          {transaction.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">
                        {transaction.amountPLN.toLocaleString('pl-PL', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">
                        PLN
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
