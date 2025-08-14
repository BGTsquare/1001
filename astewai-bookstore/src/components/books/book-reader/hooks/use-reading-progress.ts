import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { Book, UserLibrary } from '@/types'

interface UseReadingProgressReturn {
  currentProgress: number
  calculateProgress: () => void
  saveProgress: (progress: number, position: string) => Promise<void>
  getCurrentReadingPosition: () => string
  restoreReadingPosition: (position: string) => void
  contentRef: React.RefObject<HTMLDivElement>
}

interface UseReadingProgressProps {
  book: Book
  libraryItem: UserLibrary
  onProgressUpdate?: (progress: number, position: string) => void
  onStatusUpdate?: (status: 'owned' | 'pending' | 'completed') => void
}

export function useReadingProgress({
  book,
  libraryItem,
  onProgressUpdate,
  onStatusUpdate
}: UseReadingProgressProps): UseReadingProgressReturn {
  const contentRef = useRef<HTMLDivElement>(null)
  const [currentProgress, setCurrentProgress] = useState(libraryItem.progress || 0)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Calculate reading progress based on scroll position
  const calculateProgress = useCallback(() => {
    if (!contentRef.current) return

    const element = contentRef.current
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight - element.clientHeight
    
    if (scrollHeight <= 0) return

    const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100))
    setCurrentProgress(Math.round(progress))
  }, [])

  // Get current reading position for persistence
  const getCurrentReadingPosition = useCallback((): string => {
    if (!contentRef.current) return '0'
    
    const scrollTop = contentRef.current.scrollTop
    const scrollHeight = contentRef.current.scrollHeight
    
    return JSON.stringify({
      scrollTop,
      scrollHeight,
      timestamp: Date.now()
    })
  }, [])

  // Restore reading position
  const restoreReadingPosition = useCallback((position: string) => {
    if (!contentRef.current) return

    try {
      const { scrollTop } = JSON.parse(position)
      contentRef.current.scrollTop = scrollTop
      calculateProgress()
    } catch (error) {
      console.error('Error restoring reading position:', error)
    }
  }, [calculateProgress])

  // Save progress to server
  const saveProgress = useCallback(async (progress: number, position: string) => {
    try {
      const response = await fetch('/api/library/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          progress,
          lastReadPosition: position,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save progress')
      }

      const result = await response.json()
      
      // Check if book was completed
      if (result.statusChanged && result.data?.status === 'completed') {
        toast.success('Congratulations! You completed the book!')
        onStatusUpdate?.('completed')
      }

      onProgressUpdate?.(progress, position)
    } catch (error) {
      console.error('Error saving progress:', error)
      toast.error('Failed to save reading progress')
    }
  }, [book.id, onProgressUpdate, onStatusUpdate])

  // Auto-save reading progress with debouncing
  useEffect(() => {
    if (currentProgress === libraryItem.progress) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      const position = getCurrentReadingPosition()
      saveProgress(currentProgress, position)
    }, 2000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [currentProgress, libraryItem.progress, getCurrentReadingPosition, saveProgress])

  // Handle scroll events for progress tracking
  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    const handleScroll = () => {
      calculateProgress()
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [calculateProgress])

  // Restore reading position on mount
  useEffect(() => {
    if (libraryItem.last_read_position) {
      const timer = setTimeout(() => {
        restoreReadingPosition(libraryItem.last_read_position!)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [libraryItem.last_read_position, restoreReadingPosition])

  return {
    currentProgress,
    calculateProgress,
    saveProgress,
    getCurrentReadingPosition,
    restoreReadingPosition,
    contentRef
  }
}