import type { BundleFormData, ValidationErrors } from '../types'

export function validateBundleForm(formData: BundleFormData): ValidationErrors {
  const errors: ValidationErrors = {}

  // Bundle validation
  if (!formData.title.trim()) {
    errors.bundleTitle = 'Bundle title is required'
  }

  if (!formData.price || parseFloat(formData.price) <= 0) {
    errors.bundlePrice = 'Valid bundle price is required'
  }

  if (formData.books.length === 0) {
    errors.books = 'At least one book must be added to the bundle'
  }

  // Book validation
  formData.books.forEach((book, index) => {
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
  const bundlePriceNum = parseFloat(formData.price) || 0
  const totalBookPrice = formData.books.reduce((sum, book) => sum + (book.price || 0), 0)

  if (bundlePriceNum > totalBookPrice) {
    errors.bundlePrice = 'Bundle price cannot exceed total book prices'
  }

  if (bundlePriceNum >= totalBookPrice * 0.99) {
    errors.bundlePrice = 'Bundle must provide at least 1% discount'
  }

  return errors
}

export function calculatePricingMetrics(formData: BundleFormData) {
  const totalBookPrice = formData.books.reduce((sum, book) => sum + (book.price || 0), 0)
  const bundlePriceNum = parseFloat(formData.price) || 0
  const savings = totalBookPrice - bundlePriceNum
  const discountPercentage = totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0

  return {
    totalBookPrice,
    bundlePrice: bundlePriceNum,
    savings,
    discountPercentage
  }
}