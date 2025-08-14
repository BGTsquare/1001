/**
 * Enhanced type definitions for database operations
 */

import type { Book, Bundle, BlogPost, UserLibrary, Purchase } from '@/types'

// Common filter and pagination types
export interface PaginationOptions {
  limit?: number
  offset?: number
}

export interface SortOptions<T extends string = string> {
  sortBy?: T
  sortOrder?: 'asc' | 'desc'
}

export interface SearchOptions {
  query?: string
}

// Book-specific types
export interface BookFilters extends PaginationOptions, SortOptions<'created_at' | 'title' | 'author' | 'price'>, SearchOptions {
  category?: string
  isFree?: boolean
  author?: string
  tags?: string[]
  priceRange?: [number, number]
}

export interface BookCreateData {
  title: string
  author: string
  description?: string
  cover_image_url?: string
  content_url?: string
  price: number
  is_free?: boolean
  category?: string
  tags?: string[]
}

export interface BookUpdateData extends Partial<BookCreateData> {
  updated_at?: string
}

// Bundle-specific types
export interface BundleFilters extends PaginationOptions, SortOptions<'created_at' | 'title' | 'price'>, SearchOptions {
  priceRange?: [number, number]
  bookCount?: [number, number]
}

export interface BundleCreateData {
  title: string
  description?: string
  price: number
  book_ids?: string[]
}

export interface BundleUpdateData extends Partial<BundleCreateData> {
  updated_at?: string
}

// Blog-specific types
export interface BlogPostFilters extends PaginationOptions, SortOptions<'created_at' | 'updated_at' | 'title'>, SearchOptions {
  category?: string
  published?: boolean
  author?: string
  tags?: string[]
}

export interface BlogPostCreateData {
  title: string
  content: string
  excerpt?: string
  category?: string
  published?: boolean
  author?: string
  tags?: string[]
  featured_image_url?: string
  slug?: string
}

export interface BlogPostUpdateData extends Partial<BlogPostCreateData> {
  updated_at?: string
}

// Library-specific types
export interface LibraryFilters extends PaginationOptions, SortOptions<'added_at' | 'last_read_at' | 'progress'> {
  status?: 'owned' | 'pending' | 'completed'
  category?: string
  progress?: [number, number]
}

export interface LibraryUpdateData {
  status?: 'owned' | 'pending' | 'completed'
  progress?: number
  last_read_position?: string
  last_read_at?: string
}

// Purchase-specific types
export interface PurchaseFilters extends PaginationOptions, SortOptions<'created_at' | 'updated_at' | 'amount'> {
  status?: 'pending_initiation' | 'awaiting_payment' | 'pending_verification' | 'completed' | 'rejected'
  item_type?: 'book' | 'bundle'
  amount_range?: [number, number]
  date_range?: [Date, Date]
}

export interface PurchaseCreateData {
  user_id: string
  item_type: 'book' | 'bundle'
  item_id: string
  amount: number
  status?: string
  telegram_chat_id?: number
  telegram_user_id?: number
  initiation_token?: string
  transaction_reference?: string
}

export interface PurchaseUpdateData {
  status?: string
  telegram_chat_id?: number
  telegram_user_id?: number
  transaction_reference?: string
  updated_at?: string
}

// Repository method return types
export interface RepositoryResult<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface CountResult {
  count: number
}

export interface ExistsResult {
  exists: boolean
}

// Database operation context
export interface OperationContext {
  userId?: string
  isAdmin?: boolean
  requestId?: string
  timestamp?: Date
}

// Batch operation types
export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete'
  data: T
  id?: string
}

export interface BatchResult<T> {
  success: boolean
  results: Array<{
    success: boolean
    data?: T
    error?: string
  }>
  totalProcessed: number
  totalSuccessful: number
  totalFailed: number
}

// Advanced query types
export interface JoinOptions {
  include?: string[]
  exclude?: string[]
}

export interface AggregationOptions {
  groupBy?: string[]
  having?: Record<string, any>
  aggregate?: {
    count?: string[]
    sum?: string[]
    avg?: string[]
    min?: string[]
    max?: string[]
  }
}

// Transaction types
export interface TransactionContext {
  id: string
  startTime: Date
  operations: string[]
}

export interface TransactionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rollback?: boolean
}