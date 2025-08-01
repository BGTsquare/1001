'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SortOption = 'added_at' | 'progress' | 'title' | 'updated_at'
type SortOrder = 'asc' | 'desc'

interface LibraryFiltersProps {
  sortBy: SortOption
  sortOrder: SortOrder
  onSortChange: (sortBy: SortOption, sortOrder: SortOrder) => void
  className?: string
}

export function LibraryFilters({
  sortBy,
  sortOrder,
  onSortChange,
  className
}: LibraryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'added_at', label: 'Date Added' },
    { value: 'updated_at', label: 'Last Read' },
    { value: 'title', label: 'Title' },
    { value: 'progress', label: 'Progress' }
  ]

  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      // Toggle order if same sort option
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Default order for new sort option
      const defaultOrder = newSortBy === 'title' ? 'asc' : 'desc'
      onSortChange(newSortBy, defaultOrder)
    }
  }

  const getSortLabel = (option: SortOption) => {
    const sortOption = sortOptions.find(opt => opt.value === option)
    const orderIcon = sortOrder === 'asc' ? '↑' : '↓'
    return `${sortOption?.label} ${sortBy === option ? orderIcon : ''}`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mobile toggle */}
      <div className="flex items-center justify-between md:hidden">
        <h3 className="text-sm font-medium">Sort & Filter</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'} Options
        </Button>
      </div>

      {/* Filters content */}
      <Card className={cn(
        'md:block',
        !isExpanded && 'hidden md:block'
      )}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Sort options */}
            <div>
              <h4 className="text-sm font-medium mb-3">Sort by</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sortOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange(option.value)}
                    className="justify-start text-xs"
                  >
                    {getSortLabel(option.value)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSortChange('progress', 'asc')}
                  className="text-xs"
                >
                  📖 Continue Reading
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSortChange('added_at', 'desc')}
                  className="text-xs"
                >
                  🆕 Recently Added
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSortChange('updated_at', 'desc')}
                  className="text-xs"
                >
                  📚 Recently Read
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}