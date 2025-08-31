import { createHash } from 'crypto'

export interface FileSecurityCheck {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileHash?: string
  sanitizedFileName?: string
}

export interface FileSecurityOptions {
  maxFileSize?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
  scanForMalware?: boolean
  generateHash?: boolean
}

const DEFAULT_OPTIONS: Required<FileSecurityOptions> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
  scanForMalware: false, // Would require external service
  generateHash: true
}

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin',
  '.sh', '.ps1', '.php', '.asp', '.jsp', '.py', '.rb', '.pl'
]

// MIME types that should be blocked
const DANGEROUS_MIME_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-winexe',
  'application/x-javascript',
  'text/javascript',
  'application/javascript'
]

export class FileSecurityValidator {
  private options: Required<FileSecurityOptions>

  constructor(options: FileSecurityOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  async validateFile(file: File): Promise<FileSecurityCheck> {
    const errors: string[] = []
    const warnings: string[] = []
    let fileHash: string | undefined
    let sanitizedFileName: string | undefined

    try {
      // 1. Basic file validation
      if (!file || file.size === 0) {
        errors.push('File is empty or invalid')
        return { isValid: false, errors, warnings }
      }

      // 2. File size validation
      if (file.size > this.options.maxFileSize) {
        errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.options.maxFileSize)})`)
      }

      // 3. File name validation and sanitization
      const fileNameCheck = this.validateFileName(file.name)
      if (!fileNameCheck.isValid) {
        errors.push(...fileNameCheck.errors)
      }
      sanitizedFileName = fileNameCheck.sanitizedName

      // 4. MIME type validation
      const mimeTypeCheck = this.validateMimeType(file.type)
      if (!mimeTypeCheck.isValid) {
        errors.push(...mimeTypeCheck.errors)
      }

      // 5. File extension validation
      const extensionCheck = this.validateFileExtension(file.name)
      if (!extensionCheck.isValid) {
        errors.push(...extensionCheck.errors)
      }

      // 6. File content validation (magic number check)
      const contentCheck = await this.validateFileContent(file)
      if (!contentCheck.isValid) {
        errors.push(...contentCheck.errors)
      }
      if (contentCheck.warnings) {
        warnings.push(...contentCheck.warnings)
      }

      // 7. Generate file hash for integrity
      if (this.options.generateHash) {
        fileHash = await this.generateFileHash(file)
      }

      // 8. Additional security checks
      const securityCheck = await this.performSecurityChecks(file)
      if (!securityCheck.isValid) {
        errors.push(...securityCheck.errors)
      }
      if (securityCheck.warnings) {
        warnings.push(...securityCheck.warnings)
      }

    } catch (error) {
      console.error('File validation error:', error)
      errors.push('File validation failed due to an internal error')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileHash,
      sanitizedFileName
    }
  }

  private validateFileName(fileName: string): { isValid: boolean; errors: string[]; sanitizedName: string } {
    const errors: string[] = []
    
    // Check for dangerous extensions
    const lowerFileName = fileName.toLowerCase()
    const hasDangerousExtension = DANGEROUS_EXTENSIONS.some(ext => lowerFileName.endsWith(ext))
    
    if (hasDangerousExtension) {
      errors.push('File type is not allowed for security reasons')
    }

    // Check for suspicious patterns
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      errors.push('File name contains invalid characters')
    }

    // Check for excessively long file names
    if (fileName.length > 255) {
      errors.push('File name is too long')
    }

    // Sanitize file name
    const sanitizedName = this.sanitizeFileName(fileName)

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedName
    }
  }

  private sanitizeFileName(fileName: string): string {
    // Remove or replace dangerous characters
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters
      .replace(/\.\./g, '_') // Replace directory traversal attempts
      .replace(/^\.+/, '') // Remove leading dots
      .trim()
      .substring(0, 255) // Limit length
  }

  private validateMimeType(mimeType: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for dangerous MIME types
    if (DANGEROUS_MIME_TYPES.includes(mimeType.toLowerCase())) {
      errors.push('File type is not allowed for security reasons')
    }

    // Check against allowed MIME types
    if (!this.options.allowedMimeTypes.includes(mimeType)) {
      errors.push(`File type '${mimeType}' is not allowed. Allowed types: ${this.options.allowedMimeTypes.join(', ')}`)
    }

    return { isValid: errors.length === 0, errors }
  }

  private validateFileExtension(fileName: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const extension = this.getFileExtension(fileName)

    if (!extension) {
      errors.push('File must have a valid extension')
      return { isValid: false, errors }
    }

    // Check against allowed extensions
    if (!this.options.allowedExtensions.includes(extension.toLowerCase())) {
      errors.push(`File extension '${extension}' is not allowed. Allowed extensions: ${this.options.allowedExtensions.join(', ')}`)
    }

    return { isValid: errors.length === 0, errors }
  }

  private async validateFileContent(file: File): Promise<{ isValid: boolean; errors: string[]; warnings?: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Read first few bytes to check magic numbers
      const buffer = await this.readFileHeader(file, 16)
      const magicNumber = this.getMagicNumber(buffer)

      // Validate magic number against expected file type
      const expectedMagic = this.getExpectedMagicNumber(file.type)
      if (expectedMagic && !this.matchesMagicNumber(magicNumber, expectedMagic)) {
        errors.push('File content does not match the declared file type')
      }

      // Check for embedded executables or scripts
      if (this.containsSuspiciousContent(buffer)) {
        errors.push('File contains suspicious content')
      }

    } catch (error) {
      console.error('File content validation error:', error)
      warnings.push('Could not fully validate file content')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private async performSecurityChecks(file: File): Promise<{ isValid: boolean; errors: string[]; warnings?: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for polyglot files (files that are valid in multiple formats)
    if (await this.isPolyglotFile(file)) {
      warnings.push('File may be a polyglot file - exercise caution')
    }

    // Check file entropy (high entropy might indicate encrypted/compressed malware)
    const entropy = await this.calculateFileEntropy(file)
    if (entropy > 7.5) {
      warnings.push('File has high entropy - may be compressed or encrypted')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private async readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
    const slice = file.slice(0, bytes)
    const arrayBuffer = await slice.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }

  private getMagicNumber(buffer: Uint8Array): string {
    return Array.from(buffer.slice(0, 8))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  private getExpectedMagicNumber(mimeType: string): string[] | null {
    const magicNumbers: Record<string, string[]> = {
      'image/jpeg': ['ffd8ff'],
      'image/png': ['89504e47'],
      'image/webp': ['52494646'],
      'application/pdf': ['25504446']
    }
    return magicNumbers[mimeType] || null
  }

  private matchesMagicNumber(actual: string, expected: string[]): boolean {
    return expected.some(magic => actual.toLowerCase().startsWith(magic.toLowerCase()))
  }

  private containsSuspiciousContent(buffer: Uint8Array): boolean {
    const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /%3Cscript/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(content))
  }

  private async isPolyglotFile(file: File): Promise<boolean> {
    // Simple check for common polyglot patterns
    const header = await this.readFileHeader(file, 1024)
    const content = new TextDecoder('utf-8', { fatal: false }).decode(header)
    
    // Check for HTML/JS in image files
    if (file.type.startsWith('image/') && /<[^>]+>/i.test(content)) {
      return true
    }
    
    return false
  }

  private async calculateFileEntropy(file: File): Promise<number> {
    const buffer = await this.readFileHeader(file, Math.min(file.size, 8192))
    const frequencies = new Array(256).fill(0)
    
    for (const byte of buffer) {
      frequencies[byte]++
    }
    
    let entropy = 0
    const length = buffer.length
    
    for (const freq of frequencies) {
      if (freq > 0) {
        const probability = freq / length
        entropy -= probability * Math.log2(probability)
      }
    }
    
    return entropy
  }

  private async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private getFileExtension(fileName: string): string | null {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot !== -1 ? fileName.substring(lastDot) : null
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Export default instance
export const fileSecurityValidator = new FileSecurityValidator()
