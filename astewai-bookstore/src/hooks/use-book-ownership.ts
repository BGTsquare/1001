import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

export function useBookOwnership(bookId: string) {
  const { user } = useAuth()
  const [isOwned, setIsOwned] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkOwnership = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setError(null)
        const response = await fetch(`/api/library/ownership/${bookId}`)
        
        if (!response.ok) {
          throw new Error('Failed to check ownership')
        }
        
        const result = await response.json()
        setIsOwned(result.owned || false)
      } catch (err) {
        console.error('Error checking book ownership:', err)
        setError(err instanceof Error ? err.message : 'Failed to check ownership')
      } finally {
        setIsLoading(false)
      }
    }

    checkOwnership()
  }, [user, bookId])

  return { isOwned, isLoading, error, setIsOwned }
}