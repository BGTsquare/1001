'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, BookPlus, Loader2, BookOpen, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { PurchaseRequestFormComponent, PurchaseContactModal, QuickContactButtons } from '@/components/contact'
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
  const [isOwned, setIsOwned] = useState(false)
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(true)

  // Check if user owns the book
  useEffect(() => {
    const checkOwnership = async () => {
      if (!user) {
        setIsCheckingOwnership(false)
        return
      }

      try {
        const response = await fetch(`/api/library/ownership/${book.id}`)
        if (response.ok) {
          const result = await response.json()
          setIsOwned(result.owned || false)
        }
      } catch (error) {
        console.error('Error checking book ownership:', error)
      } finally {
        setIsCheckingOwnership(false)
      }
    }

    checkOwnership()
  }, [user, book.id])

  const handleReadNow = () => {
    router.push(`/books/${book.id}/read`)
  }

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
      setIsOwned(true) // Update ownership state
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
      
      <div className="grid grid-cols-2 gap-2">
        <PurchaseRequestFormComponent
          item={book}
          itemType="book"
          trigger={
            <Button variant="outline" className="w-full" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Request Purchase
            </Button>
          }
        />
        
        <PurchaseContactModal
          item={book}
          itemType="book"
          trigger={
            <Button variant="outline" className="w-full" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Admin
            </Button>
          }
          onContactInitiated={(method) => {
            console.log(`Contact initiated via ${method} for book ${book.id}`);
          }}
        />
      </div>
      
      <QuickContactButtons
        item={book}
        itemType="book"
        onContactInitiated={(method) => {
          console.log(`Quick contact initiated via ${method} for book ${book.id}`);
        }}
        className="border rounded-lg p-3"
      />
      
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