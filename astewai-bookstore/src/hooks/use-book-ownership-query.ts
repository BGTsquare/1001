import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'

interface OwnershipResponse {
  owned: boolean
}

async function checkBookOwnership(bookId: string): Promise<OwnershipResponse> {
  const response = await fetch(`/api/library/ownership/${bookId}`)
  
  if (!response.ok) {
    throw new Error('Failed to check ownership')
  }
  
  return response.json()
}

export function useBookOwnershipQuery(bookId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['book-ownership', bookId, user?.id],
    queryFn: () => checkBookOwnership(bookId),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const updateOwnership = useMutation({
    mutationFn: async (owned: boolean) => {
      // Optimistically update the cache
      queryClient.setQueryData(['book-ownership', bookId, user?.id], { owned })
      return { owned }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-library'] })
    },
  })

  return {
    isOwned: query.data?.owned ?? false,
    isLoading: query.isLoading,
    error: query.error,
    updateOwnership: updateOwnership.mutate,
  }
}