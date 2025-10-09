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
    // Redirect users to the dedicated payment page where they can choose a method
    // and upload verification. The server-side purchase workflow will be handled
    // after verification by admin.
    setIsPurchasing(true)
    try {
      router.push(`/books/${book.id}/payment`)
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