import { useCallback } from 'react'

interface FileUploadState {
    file: File | null
    uploading: boolean
    progress: number
    url?: string
    error?: string
}

interface UseFileUploadProps {
    onUploadStart: (state: FileUploadState) => void
    onUploadProgress: (progress: number) => void
    onUploadComplete: (url: string) => void
    onUploadError: (error: string) => void
}

export function useFileUpload({
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onUploadError
}: UseFileUploadProps) {
    
    const uploadFile = useCallback(async (
        file: File, 
        type: 'cover' | 'content',
        options: {
            optimize?: boolean
            generateThumbnail?: boolean
        } = {}
    ) => {
        onUploadStart({
            file,
            uploading: true,
            progress: 0
        })

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', type)
            formData.append('optimize', options.optimize ? 'true' : 'false')
            formData.append('generateThumbnail', options.generateThumbnail ? 'true' : 'false')

            const response = await fetch('/api/admin/books/upload-simple', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`)
            }

            const result = await response.json()
            onUploadComplete(result.url)

        } catch (error) {
            console.error('Upload error:', error)
            onUploadError('Upload failed. Please try again.')
        }
    }, [onUploadStart, onUploadProgress, onUploadComplete, onUploadError])

    const validateFile = useCallback((file: File, type: 'cover' | 'content'): string | null => {
        const maxSize = type === 'cover' ? 5 * 1024 * 1024 : 50 * 1024 * 1024 // 5MB for images, 50MB for content
        
        if (file.size > maxSize) {
            return `File size must be less than ${maxSize / (1024 * 1024)}MB`
        }

        if (type === 'cover') {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if (!allowedTypes.includes(file.type)) {
                return 'Only JPEG, PNG, WebP, and GIF images are allowed'
            }
        } else {
            const allowedTypes = ['application/pdf', 'application/epub+zip', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if (!allowedTypes.includes(file.type)) {
                return 'Only PDF, EPUB, TXT, and DOCX files are allowed'
            }
        }

        return null
    }, [])

    return {
        uploadFile,
        validateFile
    }
}