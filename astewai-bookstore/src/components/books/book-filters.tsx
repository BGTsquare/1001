'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BookFilters } from '@/types'
import { cn } from '@/lib/utils'

interface BookFiltersProps {
  filters: BookFilters
  onFiltersChange: (filters: BookFilters) => void
  categories: string[]
  tags: string[]
  className?: string
}

export function BookFiltersComponent({
  filters,
  onFiltersChange,
  categories,
  tags,
  className
}: BookFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || [])
  const [priceRange, setPriceRange] = useState<[number, number]>(
    filters.priceRange || [0, 100]
  )
  const [isFree, setIsFree] = useState<boolean | undefined>(filters.isFree)

  // Update filters when local state changes
  useEffect(() => {
    const newFilters: BookFilters = {
      ...filters,
      category: selectedCategory || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      priceRange: priceRange[0] > 0 || priceRange[1] < 100 ? priceRange : undefined,
      isFree
    }
    onFiltersChange(newFilters)
  }, [selectedCategory, selectedTags, priceRange, isFree])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setSelectedCategory('')
    setSelectedTags([])
    setPriceRange([0, 100])
    setIsFree(undefined)
  }

  const hasActiveFilters = selectedCategory || selectedTags.length > 0 || 
    priceRange[0] > 0 || priceRange[1] < 100 || isFree !== undefined

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
              aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
            >
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Price Type Filter */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Price</h4>
            <div className="flex gap-2">
              <Button
                variant={isFree === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFree(undefined)}
              >
                All
              </Button>
              <Button
                variant={isFree === true ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFree(true)}
              >
                Free
              </Button>
              <Button
                variant={isFree === false ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFree(false)}
              >
                Paid
              </Button>
            </div>
          </div>

          {/* Price Range Filter (only show for paid books) */}
          {isFree !== true && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Price Range</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Category</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Tags</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {tags.map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="relative"
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}