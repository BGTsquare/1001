'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, BookPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import type { Book } from '@/types'
import { toast } from 'sonner'

interface BookActionsProps {
  book: Book
}

export function BookActions({ book }: BookActionsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const handleAddToLibrary = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/books/' + book.id)
      return
    }

    setIsAddingToLibrary(true)
    
    try {
      const response = await fetch('/api/library/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add book to library')
      }

      toast.success('Book added to your library!')
      router.push('/library')
    } catch (error) {
      console.error('Error adding book to library:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add book to library')
    } finally {
      setIsAddingToLibrary(false)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/books/' + book.id)
      return
    }

    setIsPurchasing(true)
    
    try {
      const response = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: 'book',
          itemId: book.id,
          amount: book.price,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate purchase')
      }

      // Redirect to checkout or payment page
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        // Handle manual approval flow
        toast.success('Purchase request submitted for approval!')
        router.push('/profile?tab=purchases')
      }
    } catch (error) {
      console.error('Error initiating purchase:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to initiate purchase')
    } finally {
      setIsPurchasing(false)
    }
  }

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
      
      <Button
        onClick={handleAddToLibrary}
        disabled={isAddingToLibrary}
        variant="outline"
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
            Add to Wishlist
          </>
        )}
      </Button>
    </div>
  )
}