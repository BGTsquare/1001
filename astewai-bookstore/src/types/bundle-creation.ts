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

export interface BundleCreationErrors {
    general?: string
    bundleTitle?: string
    bundlePrice?: string
    books?: string
    [key: `book-${number}-title`]: string
    [key: `book-${number}-author`]: string
    [key: `book-${number}-cover`]: string
    [key: `book-${number}-content`]: string
}

export interface CreateBundleRequest {
    title: string
    description: string
    price: number
    cover_image_url?: string
    books: Omit<BookInsert, 'id'>[]
}

export interface CreateBundleResponse {
    id: string
    title: string
    message: string
}

// File validation constants
export const FILE_CONSTRAINTS = {
    COVER_IMAGE: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
        ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const
    },
    CONTENT_FILE: {
        MAX_SIZE: 50 * 1024 * 1024, // 50MB
        ALLOWED_TYPES: [
            'application/pdf',
            'application/epub+zip',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ] as const,
        ALLOWED_EXTENSIONS: ['.pdf', '.epub', '.txt', '.docx'] as const
    }
} as const

export type FileType = 'cover' | 'content'
export type UploadOptions = {
    optimize?: boolean
    generateThumbnail?: boolean
}