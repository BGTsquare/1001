// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Purchase API Types
export interface TelegramPurchaseRequest {
  itemType: 'book' | 'bundle'
  itemId: string
  amount: number
}

export interface TelegramPurchaseResponse {
  telegramUrl: string
  purchaseId: string
}

export interface LibraryAddRequest {
  bookId: string
}

export interface OwnershipCheckResponse {
  owned: boolean
}

// Error Types
export interface ApiError {
  error: string
  code?: string
  details?: Record<string, any>
}

// Status Types
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error'