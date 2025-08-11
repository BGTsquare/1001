import { useCallback } from 'react'
import type { FileUploadState } from '../types'

export function useFileUpload() {
  const uploadFile = useCallback(async (
    file: File,
    type: 'cover' | 'content',
    onProgress?: (progress: number) => void
  ): Promise<string> => {
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
    return result.url
  }, [])

  const createFileUploadHandler = useCallback((
    updateState: (updates: Partial<FileUploadState>) => void
  ) => {
    return async (file: File, type: 'cover' | 'content') => {
      updateState({ uploading: true, progress: 0, error: undefined })

      try {
        const url = await uploadFile(file, type)
        updateState({
          uploading: false,
          progress: 100,
          url,
          error: undefined
        })
        return url
      } catch (error) {
        console.error('Upload error:', error)
        updateState({
          uploading: false,
          progress: 0,
          error: 'Upload failed. Please try again.'
        })
        throw error
      }
    }
  }, [uploadFile])

  return {
    uploadFile,
    createFileUploadHandler
  }
}