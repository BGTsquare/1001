import { useState, useCallback } from 'react'

export interface UploadState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

export interface UploadOptions {
  type: 'cover' | 'content'
  optimize?: boolean
  generateThumbnail?: boolean
  maxSize?: number
  allowedTypes?: string[]
}

const DEFAULT_OPTIONS: Required<UploadOptions> = {
  type: 'cover',
  optimize: true,
  generateThumbnail: false,
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
}

export function useFileUpload(options: UploadOptions = { type: 'cover' }) {
  const [state, setState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0
  })

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > mergedOptions.maxSize) {
      return `File size must be less than ${mergedOptions.maxSize / (1024 * 1024)}MB`
    }

    if (!mergedOptions.allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`
    }

    return null
  }, [mergedOptions])

  const selectFile = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setState(prev => ({ ...prev, error, file: null }))
      return false
    }

    setState({
      file,
      uploading: false,
      progress: 0,
      error: undefined
    })
    return true
  }, [validateFile])

  const upload = useCallback(async (): Promise<string | null> => {
    if (!state.file) {
      setState(prev => ({ ...prev, error: 'No file selected' }))
      return null
    }

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: undefined }))

    try {
      const formData = new FormData()
      formData.append('file', state.file)
      formData.append('type', mergedOptions.type)
      formData.append('optimize', mergedOptions.optimize.toString())
      formData.append('generateThumbnail', mergedOptions.generateThumbnail.toString())

      const response = await fetch('/api/admin/books/upload-simple', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        url: result.url,
        error: undefined
      }))

      return result.url
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: errorMessage
      }))

      return null
    }
  }, [state.file, mergedOptions])

  const reset = useCallback(() => {
    setState({
      file: null,
      uploading: false,
      progress: 0,
      url: undefined,
      error: undefined
    })
  }, [])

  const remove = useCallback(() => {
    setState(prev => ({
      ...prev,
      file: null,
      url: undefined,
      error: undefined
    }))
  }, [])

  return {
    state,
    actions: {
      selectFile,
      upload,
      reset,
      remove
    }
  }
}