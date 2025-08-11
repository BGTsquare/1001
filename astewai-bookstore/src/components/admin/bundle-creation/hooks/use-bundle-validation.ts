import { useMemo } from 'react'
import type { NewBookData } from '../bundle-form-context'

interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function useBundleValidation(
  bundleTitle: string,
  bundlePrice: string,
  newBooks: NewBookData[]
): ValidationResult {
  return useMemo(() => {
    const errors: Record<string, string> = {}

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
      if (!book.title?.trim()) {
        errors[`book-${index}-title`] = `Book ${index + 1} title is required`
      }
      if (!book.author?.trim()) {
        errors[`book-${index}-author`] = `Book ${index + 1} author is required`
      }
      if (!book.cover_image_url && !book.coverImage.url) {
        errors[`book-${index}-cover`] = `Book ${index + 1} cover image is required`
      }
      if (!book.content_url && !book.contentFile.url) {
        errors[`book-${index}-content`] = `Book ${index + 1} content file is required`
      }
    })

    // Pricing validation
    const bundlePriceNum = parseFloat(bundlePrice) || 0
    const totalBookPrice = newBooks.reduce((sum, book) => sum + (book.price || 0), 0)

    if (bundlePriceNum > totalBookPrice) {
      errors.bundlePrice = 'Bundle price cannot exceed total book prices'
    }

    if (totalBookPrice > 0 && bundlePriceNum > totalBookPrice * 0.99) {
      errors.bundlePrice = 'Bundle must provide at least a 1% discount.'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [bundleTitle, bundlePrice, newBooks])
}