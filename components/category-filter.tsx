'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tags, X } from 'lucide-react'
import { useFilters } from '@/contexts/filter-context'
import type { Transaction } from '@/lib/types'
import { getCategoryColor } from '@/lib/colors'

interface CategoryFilterProps {
  transactions: Transaction[]
}

export function CategoryFilter({ transactions }: CategoryFilterProps) {
  const { filters, setSelectedCategories } = useFilters()
  const { selectedCategories } = filters

  const categories = useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach(t => cats.add(t.category))
    return Array.from(cats).sort()
  }, [transactions])

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const clearCategories = () => {
    setSelectedCategories([])
  }

  const selectAll = () => {
    setSelectedCategories([])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Tags className="h-4 w-4" />
          Categories
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filter by Category</span>
            {selectedCategories.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearCategories}
                className="h-7 px-2 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map(cat => (
                <Badge 
                  key={cat} 
                  variant="secondary" 
                  className="gap-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => toggleCategory(cat)}
                  style={{ 
                    backgroundColor: `${getCategoryColor(cat)}20`,
                    borderColor: getCategoryColor(cat)
                  }}
                >
                  {cat}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {selectedCategories.length === 0 
              ? 'All categories shown' 
              : `${selectedCategories.length} of ${categories.length} selected`}
          </div>

          <div className="border-t pt-2 max-h-[250px] overflow-y-auto space-y-1">
            {categories.map(category => (
              <label
                key={category}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                <span className="text-sm truncate flex-1">{category}</span>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function filterByCategory(transactions: Transaction[], selectedCategories: string[]): Transaction[] {
  if (selectedCategories.length === 0) return transactions
  return transactions.filter(t => selectedCategories.includes(t.category))
}
