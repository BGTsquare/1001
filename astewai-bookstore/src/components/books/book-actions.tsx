'use client'

import { ShoppingCart, BookPlus, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookOwnership } from '@/hooks/use-book-ownership'
import { useBookActions } from '@/hooks/use-book-actions'
import type { Book } from '@/types'

interface BookActionsProps {
  book: Book
  onContactInitiated?: (method: string) => void
}

export function BookActions({ book, onContactInitiated }: BookActionsProps) {
  const { isOwned, isLoading: isCheckingOwnership, setIsOwned } = useBookOwnership(book.id)
  const {
    isAddingToLibrary,
    isPurchasing,
    handleReadNow,
    handleAddToLibrary,
    handlePurchase,
  } = useBookActions({ 
    book, 
    onOwnershipChange: setIsOwned 
  })

  // Show loading state while checking ownership
  if (isCheckingOwnership) {
    return (
      <Button disabled className="w-full" size="lg">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  // If user owns the book, show "Read Now" button
  if (isOwned) {
    return (
      <Button
        onClick={handleReadNow}
        className="w-full"
        size="lg"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Read Now
      </Button>
    )
  }

  // Free book - just add to library
  if (book.is_free) {
    return (
      <Button
        onClick={handleAddToLibrary}
        disabled={isAddingToLibrary}
        className="w-full"
        size="lg"
      >
        {isAddingToLibrary ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <BookPlus className="h-4 w-4 mr-2" />
            Add to Library
          </>
        )}
      </Button>
    )
  }

  // Paid book - show only primary purchase button
  return (
    <div className="space-y-3">
      <Button
        onClick={handlePurchase}
        disabled={isPurchasing}
        className="w-full"
        size="lg"
      >
        {isPurchasing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Now
          </>
        )}
      </Button>
    </div>
  )
}