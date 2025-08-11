import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { 
  BundleFormData, 
  NewBookData, 
  ValidationErrors, 
  BookInsert,
  MINIMUM_DISCOUNT_PERCENTAGE 
} from '../types'

interface UseBundleFormProps {
  onSuccess: () => void
}

export function useBundleForm({ onSuccess }: UseBundleFormProps) {
  const [formData, setFormData] = useState<BundleFormData>({
    title: '',
    description: '',
    price: '',
    cover: { file: null, uploading: false, progress: 0 },
    books: []
  })
  
  const [errors, setErrors] = useState<ValidationErrors>({})
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

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      price: '',
      cover: { file: null, uploading: false, progress: 0 },
      books: []
    })
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

  // Pricing calculations
  const calculateTotalBookPrice = useCallback(() => {
    return formData.books.reduce((sum, book) => sum + (book.price || 0), 0)
  }, [formData.books])

  const calculateSavings = useCallback(() => {
    const totalBookPrice = calculateTotalBookPrice()
    const bundlePriceNum = parseFloat(formData.price) || 0
    return totalBookPrice - bundlePriceNum
  }, [formData.price, calculateTotalBookPrice])

  const calculateDiscountPercentage = useCallback(() => {
    const totalBookPrice = calculateTotalBookPrice()
    const savings = calculateSavings()
    return totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0
  }, [calculateTotalBookPrice, calculateSavings])

  // Validation
  const validateForm = useCallback(() => {
    const newErrors: ValidationErrors = {}

    // Bundle validation
    if (!formData.title.trim()) {
      newErrors.bundleTitle = 'Bundle title is required'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.bundlePrice = 'Valid bundle price is required'
    }

    if (formData.books.length === 0) {
      newErrors.books = 'At least one book must be added to the bundle'
    }

    // Book validation
    formData.books.forEach((book, index) => {
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

    // Pricing validation
    const bundlePriceNum = parseFloat(formData.price) || 0
    const totalBookPrice = calculateTotalBookPrice()

    if (bundlePriceNum > totalBookPrice) {
      newErrors.bundlePrice = 'Bundle price cannot exceed total book prices'
    }

    if (totalBookPrice > 0 && bundlePriceNum > totalBookPrice * (1 - MINIMUM_DISCOUNT_PERCENTAGE)) {
      newErrors.bundlePrice = `Bundle must provide at least ${MINIMUM_DISCOUNT_PERCENTAGE * 100}% discount`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, calculateTotalBookPrice])

  return {
    formData,
    errors,
    activeTab,
    createMutation,
    setActiveTab,
    updateFormData,
    addBook,
    removeBook,
    updateBook,
    calculateTotalBookPrice,
    calculateSavings,
    calculateDiscountPercentage,
    validateForm,
    resetForm
  }
}