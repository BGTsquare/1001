/**
 * Purchase system constants
 */

export const PURCHASE_STATUS = {
  PENDING: 'pending',
  PENDING_VERIFICATION: 'pending_verification',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REJECTED: 'rejected'
} as const

export type PurchaseStatus = typeof PURCHASE_STATUS[keyof typeof PURCHASE_STATUS]

export const ITEM_TYPE = {
  BOOK: 'book',
  BUNDLE: 'bundle'
} as const

export type ItemType = typeof ITEM_TYPE[keyof typeof ITEM_TYPE]

export const TRANSACTION_REFERENCE_PREFIX = 'AST'

export const PURCHASE_ERROR_MESSAGES = {
  BOOK_NOT_FOUND: 'Book not found',
  BUNDLE_NOT_FOUND: 'Bundle not found',
  ITEM_NOT_FOUND: 'Item not found',
  FREE_BOOK_PURCHASE: 'This book is free. Use the "Add to Library" option instead.',
  DUPLICATE_PURCHASE: 'You already have a purchase for this item',
  INVALID_STATUS: 'Purchase is not in the correct status for this operation',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  VALIDATION_FAILED: 'Input validation failed',
  INTERNAL_ERROR: 'Internal server error'
} as const

export const PURCHASE_SUCCESS_MESSAGES = {
  PURCHASE_CREATED: 'Purchase created successfully',
  PURCHASE_APPROVED: 'Purchase approved successfully',
  PURCHASE_REJECTED: 'Purchase rejected successfully'
} as const