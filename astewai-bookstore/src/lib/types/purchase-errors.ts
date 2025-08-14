/**
 * Purchase-specific error types for better error handling
 */

export enum PurchaseErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  TELEGRAM_ERROR = 'TELEGRAM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  DUPLICATE_PURCHASE = 'DUPLICATE_PURCHASE'
}

export interface PurchaseError {
  code: PurchaseErrorCode
  message: string
  details?: Record<string, any>
  timestamp: string
}

export class PurchaseErrorFactory {
  static createError(
    code: PurchaseErrorCode, 
    message: string, 
    details?: Record<string, any>
  ): PurchaseError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  }

  static invalidInput(field: string, value?: any): PurchaseError {
    return this.createError(
      PurchaseErrorCode.INVALID_INPUT,
      `Invalid ${field}`,
      { field, value }
    )
  }

  static itemNotFound(itemType: string, itemId: string): PurchaseError {
    return this.createError(
      PurchaseErrorCode.ITEM_NOT_FOUND,
      `${itemType} not found`,
      { itemType, itemId }
    )
  }

  static databaseError(operation: string, originalError: string): PurchaseError {
    return this.createError(
      PurchaseErrorCode.DATABASE_ERROR,
      `Database error during ${operation}`,
      { operation, originalError }
    )
  }

  static configurationError(missingConfig: string): PurchaseError {
    return this.createError(
      PurchaseErrorCode.CONFIGURATION_ERROR,
      `Configuration error: ${missingConfig}`,
      { missingConfig }
    )
  }
}