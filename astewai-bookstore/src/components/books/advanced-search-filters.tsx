'use client'

import { useState, useCallback } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { BookFilters } from '@/types'

interface AdvancedSearchFiltersProps {
  filters: BookFilters
  onFiltersChange: (filters: BookFilters) => void
  categories: string[]
  tags: string[]
  className?: string
  maxPrice?: number
  showCompact?: boolean
}

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  categories,
  tags,
  className,
  maxPrice = 100,
  showCompact = false
}: AdvancedSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(!showCompact)
  const [priceRange, setPriceRange] = useState<[number, number]>(
    filters.priceRange || [0, maxPrice]
  )

  const handleCategoryChange = useCallback((category: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      category: checked ? category : undefined
    })
  }, [filters, onFiltersChange])

  const handleTagChange = useCallback((tag: string, checked: boolean) => {
    const currentTags = filters.tags || []
    const newTags = checked 
      ? [...currentTags, tag]
      : currentTags.filter(t => t !== tag)
    
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    })
  }, [filters, onFiltersChange])

  const handleFreeFilterChange = useCallback((isFree: boolean | undefined) => {
    onFiltersChange({
      ...filters,
      isFree
    })
  }, [filters, onFiltersChange])

  const handlePriceRangeChange = useCallback((newRange: [number, number]) => {
    setPriceRange(newRange)
    onFiltersChange({
      ...filters,
      priceRange: newRange[0] === 0 && newRange[1] === maxPrice ? undefined : newRange
    })
  }, [filters, onFiltersChange, maxPrice])

  const clearAllFilters = useCallback(() => {
    setPriceRange([0, maxPrice])
    onFiltersChange({})
  }, [onFiltersChange, maxPrice])

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length
    if (filters.isFree !== undefined) count++
    if (filters.priceRange) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Type Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Price Type</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.isFree === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => handleFreeFilterChange(undefined)}
            className="h-8"
          >
            All Books
          </Button>
          <Button
            variant={filters.isFree === true ? "default" : "outline"}
            size="sm"
            onClick={() => handleFreeFilterChange(true)}
            className="h-8"
          >
            Free Only
          </Button>
          <Button
            variant={filters.isFree === false ? "default" : "outline"}
            size="sm"
            onClick={() => handleFreeFilterChange(false)}
            className="h-8"
          >
            Paid Only
          </Button>
        </div>
      </div>

      {/* Price Range Filter */}
      {filters.isFree !== true && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Price Range: ${priceRange[0]} - ${priceRange[1]}
          </Label>
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            max={maxPrice}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>${maxPrice}</span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Category</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.category === category}
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags Filter */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tags</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={filters.tags?.includes(tag) || false}
                  onCheckedChange={(checked) => 
                    handleTagChange(tag, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`tag-${tag}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {tag}
                </Label>
              </div>
            ))}
            {tags.length > 20 && (
              <p className="text-xs text-muted-foreground">
                Showing first 20 tags. Use search to find specific tags.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )

  if (showCompact) {
    return (
      <Card className={cn("", className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Advanced Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <FilterContent />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Advanced Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">
              {activeFilterCount}
            </Badge>
          )}
        </div>
      </div>
      <FilterContent />
    </Card>
  )
}