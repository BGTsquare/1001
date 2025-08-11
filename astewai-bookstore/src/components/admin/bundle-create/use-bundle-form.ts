import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
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

export function useBundleForm(onSuccess: () => void) {
  const [bundleTitle, setBundleTitle] = useState('')
  const [bundleDescription, setBundleDescription] = useState('')
  const [bundlePrice, setBundlePrice] = useState('')
  const [bundleCover, setBundleCover] = useState<BundleCoverState>({
    file: null,
    uploading: false,
    progress: 0
  })
  const [newBooks, setNewBooks] = useState<NewBookData[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('bundle-info')

  const createMutation = useMutation({
    mutationFn: async (bundleData: {
      title: string
      description: string
      price: number
      cover_image_url?: string
      books: Omit<BookInsert, 'id'>[]
    }) => {
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
    },
    onSuccess: () => {
      onSuccess()
      resetForm()
    },
    onError: (error: Error) => {
      setErrors({ general: error.message })
    }
  })

  const resetForm = useCallback(() => {
    setBundleTitle('')
    setBundleDescription('')
    setBundlePrice('')
    setBundleCover({ file: null, uploading: false, progress: 0 })
    setNewBooks([])
    setErrors({})
    setActiveTab('bundle-info')
  }, [])

  const addNewBook = useCallback(() => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newBook: NewBookData = {
      tempId,
      title: '',
      author: '',
      description: '',
      category: '',
      price: 0,
      is_free: true,
      tags: [],
      cover_image_url: '',
      content_url: '',
      coverImage: { file: null, uploading: false, progress: 0 },
      contentFile: { file: null, uploading: false, progress: 0 }
    }
    setNewBooks(prev => [...prev, newBook])
  }, [])

  const removeBook = useCallback((tempId: string) => {
    setNewBooks(prev => prev.filter(book => book.tempId !== tempId))
  }, [])

  const updateBook = useCallback((tempId: string, updates: Partial<NewBookData>) => {
    setNewBooks(prev => prev.map(book => 
      book.tempId === tempId ? { ...book, ...updates } : book
    ))
  }, [])

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!bundleTitle.trim()) {
      newErrors.bundleTitle = 'Bundle title is required'
    }

    if (!bundlePrice || parseFloat(bundlePrice) <= 0) {
      newErrors.bundlePrice = 'Valid bundle price is required'
    }

    if (newBooks.length === 0) {
      newErrors.books = 'At least one book must be added to the bundle'
    }

    // Validate each book
    newBooks.forEach((book, index) => {
      if (!book.title?.trim()) {
        newErrors[`book-${index}-title`] = `Book ${index + 1} title is required`
      }
      if (!book.author?.trim()) {
        newErrors[`book-${index}-author`] = `Book ${index + 1} author is required`
      }
      if (!book.cover_image_url && !book.coverImage.url) {
        newErrors[`book-${index}-cover`] = `Book ${index + 1} cover image is required`
      }
      if (!book.content_url && !book.contentFile.url) {
        newErrors[`book-${index}-content`] = `Book ${index + 1} content file is required`
      }
    })

    const bundlePriceNum = parseFloat(bundlePrice) || 0
    const totalBookPrice = newBooks.reduce((sum, book) => sum + (book.price || 0), 0)

    if (bundlePriceNum > totalBookPrice) {
      newErrors.bundlePrice = 'Bundle price cannot exceed total book prices'
    }

    if (bundlePriceNum >= totalBookPrice * 0.99) {
      newErrors.bundlePrice = 'Bundle must provide at least 1% discount'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [bundleTitle, bundlePrice, newBooks])

  return {
    // State
    bundleTitle,
    setBundleTitle,
    bundleDescription,
    setBundleDescription,
    bundlePrice,
    setBundlePrice,
    bundleCover,
    setBundleCover,
    newBooks,
    setNewBooks,
    errors,
    setErrors,
    activeTab,
    setActiveTab,
    
    // Actions
    addNewBook,
    removeBook,
    updateBook,
    validateForm,
    resetForm,
    
    // Mutation
    createMutation
  }
}