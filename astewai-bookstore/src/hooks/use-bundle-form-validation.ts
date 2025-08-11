import { useMemo } from 'react'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

interface NewBookData extends BookInsert {
  tempId: string
  coverImage: {
    file: File | null
    uploading: boolean
    progress: number
    url?: string
    error?: string
  }
  contentFile: {
    file: File | null
    uploading: boolean
    progress: number
    url?: string
    error?: string
  }
}

interface ValidationErrors {
  [key: string]: string
}

interface BundleFormData {
  bundleTitle: string
  bundleDescription: string
  bundlePrice: string
  newBooks: NewBookData[]
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationErrors
  warnings: string[]
}

export function useBundleFormValidation(formData: BundleFormData): ValidationResult {
  return useMemo(() => {
    const { bundleTitle, bundlePrice, newBooks } = formData
    const errors: ValidationErrors = {}
    const warnings: string[] = []

    // Bundle validation
    if (!bundleTitle.trim()) {
      errors.bundleTitle = 'Bundle title is required'
    }

    if (!bundlePrice || parseFloat(bundlePrice) <= 0) {
      errors.bundlePrice = 'Valid bundle price is required'
    }

    if (newBooks.length === 0) {
      errors.books = 'At least one book must be added to the bundle'
    }

    // Book validation
    newBooks.forEach((book, index) => {
      const prefix = `book-${index}`
      
      if (!book.title?.trim()) {
        errors[`${prefix}-title`] = `Book ${index + 1} title is required`
      }
      
      if (!book.author?.trim()) {
        errors[`${prefix}-author`] = `Book ${index + 1} author is required`
      }
      
      if (!book.cover_image_url && !book.coverImage.url) {
        errors[`${prefix}-cover`] = `Book ${index + 1} cover image is required`
      }
      
      if (!book.content_url && !book.contentFile.url) {
        errors[`${prefix}-content`] = `Book ${index + 1} content file is required`
      }

      // Book pricing validation
      if (book.price < 0) {
        errors[`${prefix}-price`] = `Book ${index + 1} price cannot be negative`
      }

      if (!book.is_free && book.price === 0) {
        warnings.push(`Book ${index + 1} has zero price but is not marked as free`)
      }
    })

    // Bundle pricing validation
    const bundlePriceNum = parseFloat(bundlePrice) || 0
    const totalBookPrice = newBooks.reduce((sum, book) => sum + (book.price || 0), 0)

    if (bundlePriceNum > totalBookPrice) {
      errors.bundlePrice = 'Bundle price cannot exceed total book prices'
    }

    if (totalBookPrice > 0 && bundlePriceNum > totalBookPrice * 0.99) {
      errors.bundlePrice = 'Bundle must provide at least a 1% discount'
    }

    // Pricing warnings
    const discountPercentage = totalBookPrice > 0 ? ((totalBookPrice - bundlePriceNum) / totalBookPrice) * 100 : 0
    
    if (discountPercentage > 50) {
      warnings.push('Bundle discount exceeds 50% - consider reviewing pricing')
    }

    if (discountPercentage < 5 && totalBookPrice > 0) {
      warnings.push('Bundle discount is less than 5% - customers may not find it attractive')
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }, [formData])
}

// Separate hook for pricing calculations
export function useBundlePricing(books: NewBookData[], bundlePrice: string) {
  return useMemo(() => {
    const totalBookPrice = books.reduce((sum, book) => sum + (book.price || 0), 0)
    const bundlePriceNum = parseFloat(bundlePrice) || 0
    const savings = totalBookPrice - bundlePriceNum
    const discountPercentage = totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0

    return {
      totalBookPrice,
      bundlePrice: bundlePriceNum,
      savings,
      discountPercentage
    }
  }, [books, bundlePrice])
}