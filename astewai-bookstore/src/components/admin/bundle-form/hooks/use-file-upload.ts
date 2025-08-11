import { useCallback } from 'react'
import type { FileUploadState } from '../types'

interface UseFileUploadProps {
  onUploadSuccess: (url: string) => void
  onUploadError: (error: string) => void
  onUploadProgress: (progress: number) => void
  onUploadStart: () => void
}

export function useFileUpload({
  onUploadSuccess,
  onUploadError,
  onUploadProgress,
  onUploadStart
}: UseFileUploadProps) {
  
  const uploadFile = useCallback(async (
    file: File, 
    type: 'cover' | 'content'
  ): Promise<string> => {
    onUploadStart()
    
    try {
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

      const result = await response.json()
      onUploadProgress(100)
      onUploadSuccess(result.url)
      
      return result.url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      onUploadError(errorMessage)
      throw error
    }
  }, [onUploadStart, onUploadProgress, onUploadSuccess, onUploadError])

  const validateFile = useCallback((file: File, type: 'cover' | 'content'): string | null => {
    const maxSize = type === 'cover' ? 5 * 1024 * 1024 : 50 * 1024 * 1024 // 5MB for covers, 50MB for content
    
    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / (1024 * 1024)}MB`
    }

    if (type === 'cover' && !file.type.startsWith('image/')) {
      return 'Cover must be an image file'
    }

    if (type === 'content' && !['application/pdf', 'application/epub+zip'].includes(file.type)) {
      return 'Content must be a PDF or EPUB file'
    }

    return null
  }, [])

  return {
    uploadFile,
    validateFile
  }
}