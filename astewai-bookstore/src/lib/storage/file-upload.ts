import { validateFile, generateUniqueFileName } from './file-validation'
import { optimizeImage, createThumbnail } from './image-processing'
import { StorageClient } from './storage-client'
import { FileUploadOptions, FileUploadResult, FileUploadProgress, FileType } from './types'

export class FileUploadService {
  private storageClient = new StorageClient()

  /**
   * Uploads a single file with validation, optimization, and progress tracking
   */
  async uploadFile(
    file: File,
    fileType: FileType,
    options: FileUploadOptions = {},
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    // Validate file
    const validation = validateFile(file, fileType, {
      maxSize: options.maxSize,
      allowedTypes: options.allowedTypes
    })

    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }

    let processedFile = file
    let thumbnailFile: File | null = null

    // Optimize image if requested
    if (options.optimizeImage && file.type.startsWith('image/')) {
      try {
        processedFile = await optimizeImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          format: 'webp'
        })
      } catch (error) {
        console.warn('Image optimization failed, using original file:', error)
      }
    }

    // Generate thumbnail if requested
    if (options.generateThumbnail && file.type.startsWith('image/')) {
      try {
        thumbnailFile = await createThumbnail(file, 200)
      } catch (error) {
        console.warn('Thumbnail generation failed:', error)
      }
    }

    // Generate unique file names
    const fileName = generateUniqueFileName(processedFile.name, options.folder)
    const thumbnailFileName = thumbnailFile 
      ? generateUniqueFileName(`thumb_${thumbnailFile.name}`, `${options.folder}/thumbnails`)
      : undefined

    try {
      // Upload main file
      const uploadResult = await this.storageClient.uploadFile(
        processedFile,
        fileName,
        onProgress
      )

      // Upload thumbnail if available
      let thumbnailUrl: string | undefined
      if (thumbnailFile && thumbnailFileName) {
        try {
          const thumbnailResult = await this.storageClient.uploadFile(
            thumbnailFile,
            thumbnailFileName
          )
          thumbnailUrl = thumbnailResult.url
        } catch (error) {
          console.warn('Thumbnail upload failed:', error)
        }
      }

      return {
        ...uploadResult,
        thumbnailUrl
      }
    } catch (error) {
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Uploads multiple files with batch processing
   */
  async uploadFiles(
    files: { file: File; fileType: FileType; options?: FileUploadOptions }[],
    onProgress?: (fileIndex: number, progress: FileUploadProgress) => void
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const { file, fileType, options = {} } = files[i]
      
      try {
        const result = await this.uploadFile(
          file,
          fileType,
          options,
          onProgress ? (progress) => onProgress(i, progress) : undefined
        )
        results.push(result)
      } catch (error) {
        throw new Error(`Failed to upload file ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return results
  }

  /**
   * Replaces an existing file
   */
  async replaceFile(
    oldFileName: string,
    newFile: File,
    fileType: FileType,
    options: FileUploadOptions = {},
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      // Upload new file first
      const uploadResult = await this.uploadFile(newFile, fileType, options, onProgress)
      
      // Delete old file after successful upload
      try {
        await this.storageClient.deleteFile(oldFileName)
      } catch (error) {
        console.warn('Failed to delete old file:', error)
      }

      return uploadResult
    } catch (error) {
      throw new Error(`File replacement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deletes a file and its thumbnail
   */
  async deleteFile(fileName: string, thumbnailFileName?: string): Promise<void> {
    const filesToDelete = [fileName]
    if (thumbnailFileName) {
      filesToDelete.push(thumbnailFileName)
    }

    await this.storageClient.deleteFiles(filesToDelete)
  }

  /**
   * Gets upload progress for client-side tracking
   */
  createProgressTracker(): {
    onProgress: (progress: FileUploadProgress) => void
    getProgress: () => FileUploadProgress
  } {
    let currentProgress: FileUploadProgress = {
      loaded: 0,
      total: 0,
      percentage: 0
    }

    return {
      onProgress: (progress: FileUploadProgress) => {
        currentProgress = progress
      },
      getProgress: () => currentProgress
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService()