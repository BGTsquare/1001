import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { BundleFormData, NewBookData, ValidationErrors } from '../types'

const INITIAL_BUNDLE_STATE: BundleFormData = {
  title: '',
  description: '',
  price: '',
  cover: { file: null, uploading: false, progress: 0 },
  books: []
}

export function useBundleForm(onSuccess: () => void) {
  const [formData, setFormData] = useState<BundleFormData>(INITIAL_BUNDLE_STATE)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [activeTab, setActiveTab] = useState('bundle-info')

  const resetForm = useCallback(() => {
    setFormData(INITIAL_BUNDLE_STATE)
    setErrors({})
    setActiveTab('bundle-info')
  }, [])

  const updateFormData = useCallback((updates: Partial<BundleFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const addBook = useCallback(() => {
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
    
    setFormData(prev => ({
      ...prev,
      books: [...prev.books, newBook]
    }))
  }, [])

  const removeBook = useCallback((tempId: string) => {
    setFormData(prev => ({
      ...prev,
      books: prev.books.filter(book => book.tempId !== tempId)
    }))
  }, [])

  const updateBook = useCallback((tempId: string, updates: Partial<NewBookData>) => {
    setFormData(prev => ({
      ...prev,
      books: prev.books.map(book => 
        book.tempId === tempId ? { ...book, ...updates } : book
      )
    }))
  }, [])

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
        headers: { 'Content-Type': 'application/json' },
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

  return {
    formData,
    errors,
    activeTab,
    setActiveTab,
    setErrors,
    updateFormData,
    addBook,
    removeBook,
    updateBook,
    resetForm,
    createMutation
  }
}