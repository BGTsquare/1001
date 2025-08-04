import { FileValidationResult, FileType, FILE_TYPE_CONFIGS } from './types'

/**
 * Validates a file against security and type constraints
 */
export function validateFile(
  file: File,
  fileType: FileType,
  customOptions?: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  }
): FileValidationResult {
  const errors: string[] = []
  const config = FILE_TYPE_CONFIGS[fileType]
  
  // Use custom options or fall back to config defaults
  const maxSize = customOptions?.maxSize ?? config.maxSize
  const allowedTypes = customOptions?.allowedTypes ?? config.allowedMimeTypes
  const allowedExtensions = customOptions?.allowedExtensions ?? config.allowedExtensions

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    errors.push(`File size must be less than ${maxSizeMB}MB`)
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not allowed`)
    }
  }

  // Security checks
  if (containsSuspiciousContent(file.name)) {
    errors.push('File name contains suspicious characters')
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push('File cannot be empty')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Checks for suspicious content in file names
 */
function containsSuspiciousContent(fileName: string): boolean {
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /[<>:"|?*]/,  // Invalid filename characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
    /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|app)$/i  // Executable extensions
  ]

  return suspiciousPatterns.some(pattern => pattern.test(fileName))
}

/**
 * Sanitizes a filename for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  // Remove or replace unsafe characters
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // Replace unsafe chars with underscore
    .replace(/_{2,}/g, '_')  // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')  // Remove leading/trailing underscores
    .replace(/_+\./g, '.')  // Remove underscores before extension
    .toLowerCase()
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFileName(originalName: string, folder?: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() || '' : ''
  const nameWithoutExt = originalName.includes('.') ? originalName.replace(/\.[^/.]+$/, '') : originalName
  const sanitizedName = sanitizeFileName(nameWithoutExt)
  
  const uniqueName = extension 
    ? `${timestamp}-${randomString}-${sanitizedName}.${extension}`
    : `${timestamp}-${randomString}-${sanitizedName}`
  
  return folder ? `${folder}/${uniqueName}` : uniqueName
}

/**
 * Validates image dimensions
 */
export async function validateImageDimensions(
  file: File,
  maxWidth?: number,
  maxHeight?: number
): Promise<FileValidationResult> {
  const errors: string[] = []

  if (!file.type.startsWith('image/')) {
    return { isValid: true, errors: [] } // Skip validation for non-images
  }

  try {
    const dimensions = await getImageDimensions(file)
    
    if (maxWidth && dimensions.width > maxWidth) {
      errors.push(`Image width must be less than ${maxWidth}px`)
    }
    
    if (maxHeight && dimensions.height > maxHeight) {
      errors.push(`Image height must be less than ${maxHeight}px`)
    }
  } catch (error) {
    errors.push('Unable to read image dimensions')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Gets image dimensions from a file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}