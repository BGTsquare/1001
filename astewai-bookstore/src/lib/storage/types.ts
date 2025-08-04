export interface FileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  folder?: string
  generateThumbnail?: boolean
  optimizeImage?: boolean
}

export interface FileUploadResult {
  url: string
  fileName: string
  size: number
  type: string
  thumbnailUrl?: string
}

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
}

export interface StorageFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
  uploadedBy: string
}

export type FileType = 'image' | 'document' | 'book' | 'other'

export interface FileTypeConfig {
  maxSize: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
}

export const FILE_TYPE_CONFIGS: Record<FileType, FileTypeConfig> = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt']
  },
  book: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/epub+zip',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.pdf', '.epub', '.txt', '.docx']
  },
  other: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [],
    allowedExtensions: []
  }
}