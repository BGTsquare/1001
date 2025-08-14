import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import type { Book } from '@/types'

interface UseBookActionsProps {
  book: Book
  onOwnershipChange?: (isOwned: boolean) => void
}

export function useBookActions({ book, onOwnershipChange }: UseBookActionsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const handleReadNow = useCallback(() => {
    router.push(`/books/${book.id}/read`)
  }, [router, book.id])

  const handleAddToLibrary = useCallback(async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/books/${book.id}`)
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
      onOwnershipChange?.(true)
      router.push('/library')
    } catch (error) {
      console.error('Error adding book to library:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add book to library')
    } finally {
      setIsAddingToLibrary(false)
    }
  }, [user, router, book.id, onOwnershipChange])

  const handlePurchase = useCallback(async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/books/${book.id}`)
      return
    }

    setIsPurchasing(true)
    
    try {
      const response = await fetch('/api/purchases/initiate-telegram', {
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

      if (result.data?.telegramUrl) {
        toast.success('Redirecting to Telegram for payment...')
        window.location.href = result.data.telegramUrl
      } else {
        throw new Error('No Telegram URL received')
      }
    } catch (error) {
      console.error('Error initiating purchase:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to initiate purchase')
    } finally {
      setIsPurchasing(false)
    }
  }, [user, router, book.id, book.price])

  return {
    isAddingToLibrary,
    isPurchasing,
    handleReadNow,
    handleAddToLibrary,
    handlePurchase,
  }
}