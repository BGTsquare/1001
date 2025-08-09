import type { StorageBucketConfig } from '@/lib/services/storage-service'

/**
 * Storage configuration constants
 */
export const STORAGE_LIMITS = {
  /** 50MB in bytes */
  MAX_FILE_SIZE: 52428800,
  /** 10MB in bytes - for images */
  MAX_IMAGE_SIZE: 10485760,
  /** 100MB in bytes - for large documents */
  MAX_DOCUMENT_SIZE: 104857600
} as const

/**
 * Supported MIME types for different file categories
 */
export const MIME_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/epub+zip',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  AUDIO: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ],
  VIDEO: [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
} as const

/**
 * Predefined storage bucket configurations
 */
export const BUCKET_CONFIGS: Record<string, StorageBucketConfig> = {
  BOOKS: {
    id: 'books',
    public: true,
    fileSizeLimit: STORAGE_LIMITS.MAX_FILE_SIZE,
    allowedMimeTypes: [
      ...MIME_TYPES.IMAGES,
      ...MIME_TYPES.DOCUMENTS
    ]
  },
  AVATARS: {
    id: 'avatars',
    public: true,
    fileSizeLimit: STORAGE_LIMITS.MAX_IMAGE_SIZE,
    allowedMimeTypes: MIME_TYPES.IMAGES
  },
  PRIVATE_DOCUMENTS: {
    id: 'private-documents',
    public: false,
    fileSizeLimit: STORAGE_LIMITS.MAX_DOCUMENT_SIZE,
    allowedMimeTypes: MIME_TYPES.DOCUMENTS
  }
} as const

/**
 * File path generators for consistent storage organization
 */
export const STORAGE_PATHS = {
  /**
   * Generate path for book cover images
   */
  bookCover: (bookId: string, filename: string) => 
    `books/${bookId}/covers/${filename}`,
  
  /**
   * Generate path for book content files
   */
  bookContent: (bookId: string, filename: string) => 
    `books/${bookId}/content/${filename}`,
  
  /**
   * Generate path for user avatars
   */
  userAvatar: (userId: string, filename: string) => 
    `avatars/${userId}/${filename}`,
  
  /**
   * Generate path for bundle images
   */
  bundleImage: (bundleId: string, filename: string) => 
    `bundles/${bundleId}/${filename}`,
  
  /**
   * Generate path for blog post images
   */
  blogImage: (postId: string, filename: string) => 
    `blog/${postId}/${filename}`
} as const

/**
 * Utility functions for file validation
 */
export const FILE_UTILS = {
  /**
   * Check if file type is allowed for a bucket
   */
  isAllowedMimeType: (mimeType: string, bucketConfig: StorageBucketConfig) => 
    bucketConfig.allowedMimeTypes.includes(mimeType),
  
  /**
   * Check if file size is within limits
   */
  isValidFileSize: (fileSize: number, bucketConfig: StorageBucketConfig) => 
    fileSize <= bucketConfig.fileSizeLimit,
  
  /**
   * Get file extension from filename
   */
  getFileExtension: (filename: string) => 
    filename.split('.').pop()?.toLowerCase() || '',
  
  /**
   * Generate unique filename with timestamp
   */
  generateUniqueFilename: (originalName: string) => {
    const timestamp = Date.now()
    const extension = FILE_UTILS.getFileExtension(originalName)
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    return `${nameWithoutExt}-${timestamp}.${extension}`
  },
  
  /**
   * Sanitize filename for storage
   */
  sanitizeFilename: (filename: string) => 
    filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
} as const