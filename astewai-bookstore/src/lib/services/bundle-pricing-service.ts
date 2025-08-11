import type { Bundle, Book } from '@/types'
import { BundleRepository, type RepositoryResult } from '@/lib/repositories/improved-bundle-repository'

export interface BundleValue {
  bundlePrice: number
  totalBookPrice: number
  savings: number
  discountPercentage: number
}

export interface BundleValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class BundlePricingService {
  constructor(private bundleRepository: BundleRepository) {}

  /**
   * Calculate bundle value and savings
   */
  async calculateBundleValue(bundleId: string): Promise<RepositoryResult<BundleValue>> {
    const bundleResult = await this.bundleRepository.getById(bundleId, true)
    
    if (!bundleResult.success) {
      return bundleResult
    }

    const bundle = bundleResult.data
    if (!bundle.books || bundle.books.length === 0) {
      return {
        success: false,
        error: new Error('Bundle has no books') as any
      }
    }

    const bundlePrice = bundle.price
    const totalBookPrice = bundle.books.reduce((sum, book) => sum + book.price, 0)
    const savings = totalBookPrice - bundlePrice
    const discountPercentage = totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0

    return {
      success: true,
      data: {
        bundlePrice,
        totalBookPrice,
        savings,
        discountPercentage
      }
    }
  }

  /**
   * Calculate optimal bundle price based on books
   */
  calculateOptimalBundlePrice(books: Book[], targetDiscountPercentage = 15): number {
    const totalBookPrice = books.reduce((sum, book) => sum + book.price, 0)
    const discountAmount = totalBookPrice * (targetDiscountPercentage / 100)
    return Math.max(0, totalBookPrice - discountAmount)
  }

  /**
   * Validate bundle pricing rules
   */
  validateBundlePricing(bundle: Bundle, books: Book[]): BundleValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!books || books.length === 0) {
      errors.push('Bundle must contain at least one book')
      return { isValid: false, errors, warnings }
    }

    const totalBookPrice = books.reduce((sum, book) => sum + book.price, 0)
    const bundlePrice = bundle.price
    const savings = totalBookPrice - bundlePrice
    const discountPercentage = totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0

    // Validation rules
    if (bundlePrice <= 0) {
      errors.push('Bundle price must be greater than 0')
    }

    if (bundlePrice > totalBookPrice) {
      errors.push('Bundle price cannot exceed total book prices')
    }

    if (totalBookPrice > 0 && discountPercentage < 1) {
      errors.push('Bundle must provide at least 1% discount')
    }

    // Warnings
    if (discountPercentage > 50) {
      warnings.push('Bundle discount exceeds 50% - consider reviewing pricing')
    }

    if (discountPercentage < 5) {
      warnings.push('Bundle discount is less than 5% - customers may not find it attractive')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get pricing recommendations for a bundle
   */
  getPricingRecommendations(books: Book[]): {
    conservative: number  // 5% discount
    moderate: number      // 15% discount  
    aggressive: number    // 25% discount
    totalBookPrice: number
  } {
    const totalBookPrice = books.reduce((sum, book) => sum + book.price, 0)
    
    return {
      conservative: this.calculateOptimalBundlePrice(books, 5),
      moderate: this.calculateOptimalBundlePrice(books, 15),
      aggressive: this.calculateOptimalBundlePrice(books, 25),
      totalBookPrice
    }
  }
}

// Factory function for dependency injection
export function createBundlePricingService(bundleRepository: BundleRepository): BundlePricingService {
  return new BundlePricingService(bundleRepository)
}