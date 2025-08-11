import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']

export interface CreateBundleWithBooksRequest {
  title: string
  description?: string
  price: string | number
  cover_image_url?: string
  books: BookInsert[]
}

export interface CreateBundleWithBooksResponse {
  id: string
  title: string
  description: string | null
  price: number
  cover_image_url: string | null
  created_at: string
  updated_at: string
  books: Array<{
    id: string
    title: string
    author: string
    price: number
  }>
}

export interface BundleApiError {
  error: string
  validationErrors?: Array<{
    field: string
    message: string
  }>
}

export interface BundleCreateData {
  title: string
  description: string | null
  price: number
  bookIds: string[]
  cover_image_url?: string
}