import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { parseETB } from '@/lib/utils/currency'
import type { Book } from '@/types'

interface UseBundleFormProps {
  onSuccess: () => void
}

interface BundleFormErrors {
  title?: string
  price?: string
  books?: string
  general?: string
}

export function useBundleForm({ onSuccess }: UseBundleFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([])
  const [errors, setErrors] = useState<BundleFormErrors>({})

  const calculateTotalBookPrice = useCallback(() => {
    return selectedBooks.reduce((sum, book) => sum + book.price, 0)
  }, [selectedBooks])

  const calculateSavings = useCallback(() => {
    const totalBookPrice = calculateTotalBookPrice()
    const bundlePrice = parseETB(price)
    return totalBookPrice - bundlePrice
  }, [calculateTotalBookPrice, price])

  const calculateDiscountPercentage = useCallback(() => {
    const totalBookPrice = calculateTotalBookPrice()
    const savings = calculateSavings()
    return totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0
  }, [calculateTotalBookPrice, calculateSavings])

  const validateForm = useCallback(() => {
    const newErrors: BundleFormErrors = {}

    if (!title.trim()) {
      newErrors.title = 'Bundle title is required'
    }

    const bundlePrice = parseETB(price)
    if (!price || bundlePrice <= 0) {
      newErrors.price = 'Valid price is required'
    }

    if (selectedBooks.length === 0) {
      newErrors.books = 'At least one book must be selected'
    }

    const totalBookPrice = calculateTotalBookPrice()

    if (bundlePrice > totalBookPrice) {
      newErrors.price = 'Bundle price cannot exceed total book prices'
    }

    if (bundlePrice >= totalBookPrice * 0.99) {
      newErrors.price = 'Bundle must provide at least 1% discount'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title, price, selectedBooks, calculateTotalBookPrice])

  const handleBookToggle = useCallback((book: Book) => {
    setSelectedBooks(prev => {
      const isSelected = prev.some(b => b.id === book.id)
      if (isSelected) {
        return prev.filter(b => b.id !== book.id)
      } else {
        return [...prev, book]
      }
    })
  }, [])

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setPrice('')
    setSelectedBooks([])
    setErrors({})
  }, [])

  const createMutation = useMutation({
    mutationFn: async (bundleData: {
      title: string
      description: string
      price: number
      bookIds: string[]
    }) => {
      const response = await fetch('/api/admin/bundles', {
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      price: parseETB(price),
      bookIds: selectedBooks.map(book => book.id)
    })
  }, [validateForm, createMutation, title, description, price, selectedBooks])

  return {
    // Form state
    title,
    setTitle,
    description,
    setDescription,
    price,
    setPrice,
    selectedBooks,
    errors,
    
    // Calculations
    calculateTotalBookPrice,
    calculateSavings,
    calculateDiscountPercentage,
    
    // Actions
    handleBookToggle,
    handleSubmit,
    resetForm,
    
    // Mutation state
    isSubmitting: createMutation.isPending
  }
}