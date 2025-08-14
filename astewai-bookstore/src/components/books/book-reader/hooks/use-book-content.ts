import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Book, UserLibrary } from '@/types'

interface UseBookContentReturn {
  content: string
  contentFormat: string
  isLoading: boolean
  error: string | null
}

export function useBookContent(book: Book, libraryItem: UserLibrary): UseBookContentReturn {
  const [content, setContent] = useState<string>('')
  const [contentFormat, setContentFormat] = useState<string>('text')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      if (!book.content_url) {
        setError('Book content not available')
        toast.error('Book content not available')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/books/${book.id}/content`)
        
        if (!response.ok) {
          throw new Error('Failed to load book content')
        }

        const data = await response.json()
        setContent(data.content || '')
        setContentFormat(data.contentFormat || 'text')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load book content'
        setError(errorMessage)
        console.error('Error loading book content:', err)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [book.id, book.content_url])

  return {
    content,
    contentFormat,
    isLoading,
    error
  }
}