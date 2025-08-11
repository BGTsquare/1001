import { useCallback } from 'react'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

interface FileUploadState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

interface NewBookData extends BookInsert {
  tempId: string
  coverImage: FileUploadState
  contentFile: FileUploadState
}

interface BundleCoverState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

export function useFileUpload(
  updateBook: (tempId: string, updates: Partial<NewBookData>) => void,
  setBundleCover: (cover: BundleCoverState) => void
) {
  const uploadFile = useCallback(async (tempId: string, type: 'cover' | 'content', book: NewBookData) => {
    const fileState = type === 'cover' ? book.coverImage : book.contentFile
    if (!fileState.file) return

    updateBook(tempId, {
      [type === 'cover' ? 'coverImage' : 'contentFile']: {
        ...fileState,
        uploading: true,
        progress: 0
      }
    })

    try {
      const formData = new FormData()
      formData.append('file', fileState.file)
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
      
      updateBook(tempId, {
        [type === 'cover' ? 'coverImage' : 'contentFile']: {
          ...fileState,
          uploading: false,
          progress: 100,
          url: result.url,
          error: undefined
        },
        [type === 'cover' ? 'cover_image_url' : 'content_url']: result.url
      })

    } catch (error) {
      console.error('Upload error:', error)
      updateBook(tempId, {
        [type === 'cover' ? 'coverImage' : 'contentFile']: {
          ...fileState,
          uploading: false,
          progress: 0,
          error: 'Upload failed. Please try again.'
        }
      })
    }
  }, [updateBook])

  const uploadBundleCover = useCallback(async (bundleCover: BundleCoverState) => {
    if (!bundleCover.file) return

    setBundleCover({ ...bundleCover, uploading: true, progress: 0 })

    try {
      const formData = new FormData()
      formData.append('file', bundleCover.file)
      formData.append('type', 'cover')
      formData.append('optimize', 'true')
      formData.append('generateThumbnail', 'true')

      const response = await fetch('/api/admin/books/upload-simple', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      
      setBundleCover({
        ...bundleCover,
        uploading: false,
        progress: 100,
        url: result.url,
        error: undefined
      })

    } catch (error) {
      console.error('Bundle cover upload error:', error)
      setBundleCover({
        ...bundleCover,
        uploading: false,
        progress: 0,
        error: 'Upload failed. Please try again.'
      })
    }
  }, [setBundleCover])

  const handleFileSelect = useCallback((tempId: string, type: 'cover' | 'content', file: File) => {
    updateBook(tempId, {
      [type === 'cover' ? 'coverImage' : 'contentFile']: {
        file,
        uploading: false,
        progress: 0,
        error: undefined
      }
    })
  }, [updateBook])

  const handleBundleCoverSelect = useCallback((file: File, setBundleCover: (cover: BundleCoverState) => void) => {
    setBundleCover({
      file,
      uploading: false,
      progress: 0,
      error: undefined
    })
  }, [])

  return {
    uploadFile,
    uploadBundleCover,
    handleFileSelect,
    handleBundleCoverSelect
  }
}