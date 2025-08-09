import { z } from 'zod'

// Upload request validation schema
export const uploadRequestSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size > 0,
    'File cannot be empty'
  ),
  type: z.enum(['cover', 'content'], {
    errorMap: () => ({ message: 'Type must be either "cover" or "content"' })
  }),
  optimize: z.boolean().optional().default(false),
  generateThumbnail: z.boolean().optional().default(false)
})

export type UploadRequest = z.infer<typeof uploadRequestSchema>

// Validation helper
export function validateUploadRequest(data: unknown): UploadRequest {
  return uploadRequestSchema.parse(data)
}

// File size limits by type
export const FILE_SIZE_LIMITS = {
  cover: 5 * 1024 * 1024, // 5MB
  content: 50 * 1024 * 1024 // 50MB
} as const

// Allowed MIME types by upload type
export const ALLOWED_MIME_TYPES = {
  cover: [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif'
  ],
  content: [
    'application/pdf',
    'application/epub+zip',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
} as const