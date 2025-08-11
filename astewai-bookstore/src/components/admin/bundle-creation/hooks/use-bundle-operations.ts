import { useMutation } from '@tanstack/react-query'
import type { NewBookData, BundleCoverState } from '../bundle-form-context'

interface BundleCreateData {
  title: string
  description: string
  price: number
  cover_image_url?: string
  books: any[]
}

export function useBundleOperations() {
  const createMutation = useMutation({
    mutationFn: async (bundleData: BundleCreateData) => {
      const response = await fetch('/api/admin/bundles/create-with-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundleData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create bundle')
      }

      return response.json()
    }
  })

  const uploadFile = async (file: File, type: 'cover' | 'content') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('optimize', 'true')
    formData.append('generateThumbnail', type === 'cover' ? 'true' : 'false')

    const response = await fetch('/api/admin/books/upload-simple', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }

    return response.json()
  }

  return {
    createMutation,
    uploadFile,
  }
}