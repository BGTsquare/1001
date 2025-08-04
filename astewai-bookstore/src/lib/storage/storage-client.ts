import { createClient } from '@/lib/supabase/client'
import { FileUploadResult, FileUploadProgress } from './types'

export class StorageClient {
  private supabase = createClient()
  private bucket = 'books'

  /**
   * Uploads a file to Supabase Storage with progress tracking
   */
  async uploadFile(
    file: File,
    fileName: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Simulate progress for now (Supabase doesn't provide native progress)
      if (onProgress) {
        const simulateProgress = () => {
          let loaded = 0
          const total = file.size
          const interval = setInterval(() => {
            loaded += total * 0.1
            if (loaded >= total) {
              loaded = total
              clearInterval(interval)
            }
            onProgress({
              loaded,
              total,
              percentage: Math.round((loaded / total) * 100)
            })
          }, 100)
        }
        simulateProgress()
      }

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(fileName)

      return {
        url: publicUrl,
        fileName: data.path,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Uploads multiple files concurrently
   */
  async uploadFiles(
    files: { file: File; fileName: string }[],
    onProgress?: (fileIndex: number, progress: FileUploadProgress) => void
  ): Promise<FileUploadResult[]> {
    const uploadPromises = files.map((fileData, index) =>
      this.uploadFile(
        fileData.file,
        fileData.fileName,
        onProgress ? (progress) => onProgress(index, progress) : undefined
      )
    )

    return Promise.all(uploadPromises)
  }

  /**
   * Deletes a file from storage
   */
  async deleteFile(fileName: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([fileName])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  /**
   * Deletes multiple files
   */
  async deleteFiles(fileNames: string[]): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove(fileNames)

    if (error) {
      throw new Error(`Bulk delete failed: ${error.message}`)
    }
  }

  /**
   * Lists files in a folder
   */
  async listFiles(folder?: string, limit: number = 100): Promise<any[]> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(folder, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      throw new Error(`List files failed: ${error.message}`)
    }

    return data || []
  }

  /**
   * Gets file metadata
   */
  async getFileMetadata(fileName: string): Promise<any> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list('', {
        search: fileName
      })

    if (error) {
      throw new Error(`Get metadata failed: ${error.message}`)
    }

    return data?.[0] || null
  }

  /**
   * Gets a signed URL for private file access
   */
  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(fileName, expiresIn)

    if (error) {
      throw new Error(`Get signed URL failed: ${error.message}`)
    }

    return data.signedUrl
  }

  /**
   * Moves a file to a different location
   */
  async moveFile(fromPath: string, toPath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .move(fromPath, toPath)

    if (error) {
      throw new Error(`Move file failed: ${error.message}`)
    }
  }

  /**
   * Copies a file to a different location
   */
  async copyFile(fromPath: string, toPath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .copy(fromPath, toPath)

    if (error) {
      throw new Error(`Copy file failed: ${error.message}`)
    }
  }

  /**
   * Gets storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    folderStats: Record<string, { files: number; size: number }>
  }> {
    try {
      const files = await this.listFiles('', 1000) // Get more files for stats
      
      let totalSize = 0
      const folderStats: Record<string, { files: number; size: number }> = {}

      files.forEach(file => {
        totalSize += file.metadata?.size || 0
        
        const folder = file.name.includes('/') ? file.name.split('/')[0] : 'root'
        if (!folderStats[folder]) {
          folderStats[folder] = { files: 0, size: 0 }
        }
        folderStats[folder].files++
        folderStats[folder].size += file.metadata?.size || 0
      })

      return {
        totalFiles: files.length,
        totalSize,
        folderStats
      }
    } catch (error) {
      throw new Error(`Get storage stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}