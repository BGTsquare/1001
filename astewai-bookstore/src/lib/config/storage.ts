/**
 * Storage configuration for Astewai Digital Bookstore
 * Centralized configuration for file storage limits, MIME types, and utilities
 */

// Base file size constants (in bytes)
const MB = 1024 * 1024
const SIZES = {
  SMALL: 2 * MB,   // 2MB - avatars
  MEDIUM: 5 * MB,  // 5MB - blog images  
  LARGE: 10 * MB,  // 10MB - book covers
  XLARGE: 50 * MB  // 50MB - book content
} as const

// MIME type categories
export const MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
  DOCUMENTS: ['application/pdf', 'application/epub+zip', 'text/plain', 'application/zip'] as const,
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'] as const,
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'] as const
} as const

// Storage bucket configuration
export interface BucketConfig {
  readonly name: string
  readonly isPublic: boolean
  readonly maxFileSize: number
  readonly allowedMimeTypes: readonly string[]
  readonly description: string
}

export const BUCKET_CONFIGS = {
  BOOK_COVERS: {
    name: 'book-covers',
    isPublic: true,
    maxFileSize: SIZES.LARGE,
    allowedMimeTypes: MIME_TYPES.IMAGES,
    description: 'Public bucket for book cover images'
  },
  BOOK_CONTENT: {
    name: 'book-content',
    isPublic: false,
    maxFileSize: SIZES.XLARGE,
    allowedMimeTypes: MIME_TYPES.DOCUMENTS,
    description: 'Private bucket for book content files'
  },
  BLOG_IMAGES: {
    name: 'blog-images',
    isPublic: true,
    maxFileSize: SIZES.MEDIUM,
    allowedMimeTypes: MIME_TYPES.IMAGES,
    description: 'Public bucket for blog post images'
  },
  AVATARS: {
    name: 'avatars',
    isPublic: true,
    maxFileSize: SIZES.SMALL,
    allowedMimeTypes: MIME_TYPES.IMAGES,
    description: 'Public bucket for user avatar images'
  }
} as const satisfies Record<string, BucketConfig>

// Legacy exports for backward compatibility
export const STORAGE_LIMITS = {
  MAX_FILE_SIZE: SIZES.XLARGE,
  MAX_COVER_SIZE: SIZES.LARGE,
  MAX_CONTENT_SIZE: SIZES.XLARGE,
  MAX_AVATAR_SIZE: SIZES.SMALL,
  MAX_BLOG_IMAGE_SIZE: SIZES.MEDIUM
} as const

export const BUCKET_NAMES = {
  BOOK_COVERS: BUCKET_CONFIGS.BOOK_COVERS.name,
  BOOK_CONTENT: BUCKET_CONFIGS.BOOK_CONTENT.name,
  BLOG_IMAGES: BUCKET_CONFIGS.BLOG_IMAGES.name,
  AVATARS: BUCKET_CONFIGS.AVATARS.name
} as const

// File validation and utility functions
export interface FileValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FileValidationOptions {
  bucketConfig: BucketConfig
  file: File | { size: number; type: string; name: string }
}

/**
 * Validates a file against bucket configuration
 */
export function validateFile({ bucketConfig, file }: FileValidationOptions): FileValidationResult {
  const errors: string[] = []

  // Check file size
  if (file.size > bucketConfig.maxFileSize) {
    const maxSizeMB = Math.round(bucketConfig.maxFileSize / MB)
    const fileSizeMB = Math.round(file.size / MB)
    errors.push(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`)
  }

  // Check MIME type
  if (!bucketConfig.allowedMimeTypes.includes(file.type)) {
    errors.push(`File type '${file.type}' is not allowed. Allowed types: ${bucketConfig.allowedMimeTypes.join(', ')}`)
  }

  // Check filename
  if (!file.name || file.name.trim().length === 0) {
    errors.push('Filename cannot be empty')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * File utility functions
 */
export const FileUtils = {
  /**
   * Sanitizes filename for safe storage
   */
  sanitizeFilename(filename: string): string {
    return filename
      .trim()
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()
  },

  /**
   * Extracts file extension from filename
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
  },

  /**
   * Generates unique filename with timestamp
   */
  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now()
    const extension = FileUtils.getFileExtension(originalName)
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const sanitizedName = FileUtils.sanitizeFilename(nameWithoutExt)
    
    return extension 
      ? `${timestamp}-${sanitizedName}.${extension}`
      : `${timestamp}-${sanitizedName}`
  },

  /**
   * Formats file size in human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  },

  /**
   * Generates storage path for organized file structure
   */
  generateStoragePath(bucketName: string, category: string, filename: string): string {
    const sanitizedCategory = FileUtils.sanitizeFilename(category)
    const sanitizedFilename = FileUtils.sanitizeFilename(filename)
    return `${sanitizedCategory}/${sanitizedFilename}`
  }
} as const

// Type exports for better TypeScript integration
export type BucketName = keyof typeof BUCKET_CONFIGS
export type MimeTypeCategory = keyof typeof MIME_TYPES
export type AllowedMimeType = typeof MIME_TYPES[MimeTypeCategory][number]