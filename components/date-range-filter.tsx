'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFilters } from '@/contexts/filter-context'
import type { Transaction } from '@/lib/types'

interface DateRangeFilterProps {
  className?: React.HTMLAttributes<HTMLDivElement>['className']
}

export function DateRangeFilter({ className }: DateRangeFilterProps) {
  const { filters, setSelectedDateRange } = useFilters()
  const { selectedDateRange } = filters

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!selectedDateRange) return undefined
    return {
      from: new Date(selectedDateRange.start),
      to: new Date(selectedDateRange.end),
    }
  }, [selectedDateRange])

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setSelectedDateRange({
        start: range.from.toISOString(),
        end: range.to.toISOString(),
      })
    } else if (!range) {
      setSelectedDateRange(null)
    }
  }

  const clearRange = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDateRange(null)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[240px] justify-start text-left font-normal h-10 px-3',
              !selectedDateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                'Pick a date range'
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {selectedDateRange && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={clearRange}
          className="h-10 w-10 shrink-0"
          title="Clear date range"
        >
          <X className="h-4 w-4 opacity-50 hover:opacity-100" />
          <span className="sr-only">Clear date range</span>
        </Button>
      )}
    </div>
  )
}

export function filterByDateRange(
  transactions: Transaction[],
  selectedDateRange: { start: string; end: string } | null
): Transaction[] {
  if (!selectedDateRange) return transactions

  const start = new Date(selectedDateRange.start)
  const end = new Date(selectedDateRange.end)
  
  // Set start to beginning of day and end to end of day for inclusive filtering
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return transactions.filter((t) => {
    const transactionDate = new Date(t.timestamp)
    return transactionDate >= start && transactionDate <= end
  })
}
