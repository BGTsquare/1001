'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from './progress-bar'
import { BookStatus } from './book-status'
import type { UserLibrary } from '@/types'
import { formatPrice } from '@/utils/format'
import { cn } from '@/lib/utils'

interface LibraryGridProps {
  books: UserLibrary[]
  isLoading?: boolean
  className?: string
  onProgressUpdate?: (bookId: string, progress: number) => void
  onStatusUpdate?: (bookId: string, status: 'owned' | 'pending' | 'completed') => void
  onRemoveBook?: (bookId: string) => void
}

export function LibraryGrid({
  books,
  isLoading = false,
  className,
  onProgressUpdate,
  onStatusUpdate,
  onRemoveBook
}: LibraryGridProps) {
  const [updatingBooks, setUpdatingBooks] = useState<Set<string>>(new Set())

  const handleMarkAsCompleted = useCallback(async (bookId: string) => {
    if (!onStatusUpdate) return
    
    setUpdatingBooks(prev => new Set(prev).add(bookId))
    try {
      await onStatusUpdate(bookId, 'completed')
    } finally {
      setUpdatingBooks(prev => {
        const next = new Set(prev)
        next.delete(bookId)
        return next
      })
    }
  }, [onStatusUpdate])

  const handleRemoveBook = useCallback(async (bookId: string) => {
    if (!onRemoveBook) return
    
    setUpdatingBooks(prev => new Set(prev).add(bookId))
    try {
      await onRemoveBook(bookId)
    } finally {
      setUpdatingBooks(prev => {
        const next = new Set(prev)
        next.delete(bookId)
        return next
      })
    }
  }, [onRemoveBook])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="aspect-[3/4] w-full bg-muted rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-2 bg-muted rounded w-full" />
              <div className="h-6 bg-muted rounded w-20" />
            </CardContent>
            <CardFooter>
              <div className="h-8 bg-muted rounded w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // Empty state
  if (books.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📚</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No books in your library</h3>
        <p className="text-muted-foreground mb-4">
          Start building your digital library by browsing our collection
        </p>
        <Button asChild>
          <Link href="/books">Browse Books</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
      {books.map((libraryItem) => {
        const { book, progress, status, last_read_position, added_at } = libraryItem
        const isUpdating = updatingBooks.has(libraryItem.book_id)
        
        if (!book) return null

        return (
          <Card key={libraryItem.id} className={cn('transition-opacity', isUpdating && 'opacity-50')}>
            <CardHeader className="pb-3">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                {book.cover_image_url ? (
                  <Image
                    src={book.cover_image_url}
                    alt={`Cover of ${book.title}`}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <span className="text-muted-foreground text-sm">No cover</span>
                  </div>
                )}
                
                {/* Status badge overlay */}
                <div className="absolute top-2 right-2">
                  <BookStatus status={status} progress={progress} size="sm" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <CardTitle className="line-clamp-2 text-lg leading-tight">
                <Link 
                  href={`/books/${book.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {book.title}
                </Link>
              </CardTitle>
              
              <p className="text-muted-foreground text-sm font-medium">
                by {book.author}
              </p>

              {/* Reading Progress */}
              {progress > 0 && (
                <div className="space-y-2">
                  <ProgressBar 
                    progress={progress} 
                    size="sm"
                    variant={status === 'completed' ? 'success' : 'default'}
                  />
                </div>
              )}

              {/* Book metadata */}
              <div className="flex flex-wrap gap-1">
                {book.category && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {book.category}
                  </span>
                )}
                {book.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Added date */}
              <p className="text-xs text-muted-foreground">
                Added {new Date(added_at).toLocaleDateString()}
              </p>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2">
              {/* Primary action button */}
              <div className="flex w-full gap-2">
                {status === 'completed' ? (
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/books/${book.id}/read`}>
                      Read Again
                    </Link>
                  </Button>
                ) : progress > 0 ? (
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/books/${book.id}/read`}>
                      Continue Reading
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/books/${book.id}/read`}>
                      Start Reading
                    </Link>
                  </Button>
                )}
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/books/${book.id}`}>
                    Details
                  </Link>
                </Button>
              </div>

              {/* Secondary actions */}
              <div className="flex w-full gap-2">
                {status !== 'completed' && progress < 100 && onStatusUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleMarkAsCompleted(libraryItem.book_id)}
                    disabled={isUpdating}
                  >
                    Mark Complete
                  </Button>
                )}
                
                {onRemoveBook && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveBook(libraryItem.book_id)}
                    disabled={isUpdating}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}