import type { Database } from '@/types/database'

export type BookInsert = Database['public']['Tables']['books']['Insert']

export interface FileUploadState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

export interface NewBookData extends BookInsert {
  tempId: string
  coverImage: FileUploadState
  contentFile: FileUploadState
}

export interface BundleCoverState {
  file: File | null
  uploading: boolean
  progress: number
  url?: string
  error?: string
}

export interface BundleFormData {
  title: string
  description: string
  price: string
  cover: BundleCoverState
  books: NewBookData[]
}

export interface ValidationErrors {
  [key: string]: string
}

export const BOOK_CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 
  'Romance', 'Thriller', 'Biography', 'History', 'Science', 'Technology', 
  'Business', 'Self-Help', 'Health', 'Travel', 'Cooking', 'Art', 'Music', 
  'Sports', 'Education'
] as const

export const MINIMUM_DISCOUNT_PERCENTAGE = 0.01 // 1%