'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { clientBookService } from '@/lib/services/client-book-service'
import type { SearchSuggestion, PopularSearch } from '@/lib/repositories/client-book-repository'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
  initialValue?: string
  showSuggestions?: boolean
  showPopularSearches?: boolean
  maxSuggestions?: number
}

export function SearchBar({
  onSearch,
  placeholder = "Search books by title, author, or keywords...",
  className,
  debounceMs = 300,
  initialValue = "",
  showSuggestions = true,
  showPopularSearches = true,
  maxSuggestions = 8
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Call onSearch when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  // Load suggestions when query changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!showSuggestions || !query || query.trim().length < 2) {
        setSuggestions([])
        return
      }

      setIsLoadingSuggestions(true)
      try {
        const result = await clientBookService.getSearchSuggestions(query.trim(), maxSuggestions)
        if (result.success && result.data) {
          setSuggestions(result.data)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error('Error loading suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    const timer = setTimeout(loadSuggestions, 150) // Shorter delay for suggestions
    return () => clearTimeout(timer)
  }, [query, showSuggestions, maxSuggestions])

  // Load popular searches on mount
  useEffect(() => {
    const loadPopularSearches = async () => {
      if (!showPopularSearches) return

      try {
        const result = await clientBookService.getPopularSearches('7 days', 5)
        if (result.success && result.data) {
          setPopularSearches(result.data)
        }
      } catch (error) {
        console.error('Error loading popular searches:', error)
      }
    }

    loadPopularSearches()
  }, [showPopularSearches])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = useCallback(() => {
    setQuery('')
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    // Immediately trigger search on form submit
    setDebouncedQuery(query)
    onSearch(query)
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }, [query, onSearch])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setSelectedIndex(-1)
    
    // Show dropdown when typing
    if (newQuery.trim().length > 0 || popularSearches.length > 0) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }, [popularSearches.length])

  const handleInputFocus = useCallback(() => {
    if (query.trim().length > 0 || popularSearches.length > 0) {
      setShowDropdown(true)
    }
  }, [query, popularSearches.length])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion)
    setDebouncedQuery(suggestion)
    onSearch(suggestion)
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }, [onSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown) return

    const allItems = [
      ...suggestions.map(s => s.suggestion),
      ...popularSearches.map(p => p.search_query)
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          e.preventDefault()
          handleSuggestionClick(allItems[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [showDropdown, suggestions, popularSearches, selectedIndex, handleSuggestionClick])

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.trim()})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : part
    )
  }

  // Combined items for keyboard navigation
  const allItems = [
    ...suggestions.map(s => s.suggestion),
    ...popularSearches.map(p => p.search_query)
  ]

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
            aria-label="Search books"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            role="combobox"
            autoComplete="off"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Dropdown with suggestions and popular searches */}
      {showDropdown && (
        <Card 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto shadow-lg"
        >
          <div className="p-2">
            <>
              {/* Loading state */}
              {isLoadingSuggestions && query.trim().length >= 2 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading suggestions...
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onClick={() => handleSuggestionClick(suggestion.suggestion)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-muted rounded-md flex items-center justify-between group",
                        selectedIndex === index && "bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Search className="h-3 w-3 text-muted-foreground" />
                        <span>{highlightMatch(suggestion.suggestion, query)}</span>
                      </span>
                      <Badge variant="secondary" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {suggestion.frequency}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular searches */}
              {popularSearches.length > 0 && query.trim().length === 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Popular Searches
                  </div>
                  {popularSearches.map((popular, index) => (
                    <button
                      key={`popular-${index}`}
                      onClick={() => handleSuggestionClick(popular.search_query)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-muted rounded-md flex items-center justify-between group",
                        selectedIndex === suggestions.length + index && "bg-muted"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{popular.search_query}</span>
                      </span>
                      <Badge variant="secondary" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {popular.search_count}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Separator */}
              {suggestions.length > 0 && showPopularSearches && popularSearches.length > 0 && (
                <div className="border-t border-border my-2" />
              )}

              {/* No results */}
              {!isLoadingSuggestions && suggestions.length === 0 && popularSearches.length === 0 && query.trim().length >= 2 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No suggestions found
                </div>
              ) : null}
            </>
          </div>
        </Card>
      )}
    </div>
  )
}