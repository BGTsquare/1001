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
  price: number
  cover_image_url?: string
  books: Omit<BookInsert, 'id'>[]
}

export interface ValidationErrors {
  [key: string]: string
}

export interface BundleCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export interface BookEditorProps {
  book: NewBookData
  index: number
  categories: readonly string[]
  errors: ValidationErrors
  onUpdate: (updates: Partial<NewBookData>) => void
  onRemove: () => void
  onFileSelect: (type: 'cover' | 'content', file: File) => void
  onUploadFile: (type: 'cover' | 'content') => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export type FileUploadType = 'cover' | 'content'

export interface PricingCalculations {
  totalBookPrice: number
  bundlePrice: number
  savings: number
  discountPercentage: number
}