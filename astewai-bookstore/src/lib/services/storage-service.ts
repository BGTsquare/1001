import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface StorageBucketConfig {
  id: string
  public: boolean
  fileSizeLimit: number
  allowedMimeTypes: string[]
}

export interface StorageSetupResult {
  created: boolean
  message: string
  bucket: any
}

/**
 * Service for managing Supabase storage operations
 */
export class StorageService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new instance with server client
   */
  static async create() {
    const supabase = await createClient()
    return new StorageService(supabase)
  }

  /**
   * Check if a storage bucket exists
   */
  async bucketExists(bucketId: string) {
    const { data: buckets, error } = await this.supabase.storage.listBuckets()
    
    if (error) {
      throw new Error(`Failed to list buckets: ${error.message}`)
    }
    
    return buckets.find(bucket => bucket.id === bucketId)
  }

  /**
   * Create a new storage bucket
   */
  async createBucket(config: StorageBucketConfig) {
    const { data, error } = await this.supabase.storage.createBucket(config.id, {
      public: config.public,
      fileSizeLimit: config.fileSizeLimit,
      allowedMimeTypes: config.allowedMimeTypes
    })
    
    if (error) {
      throw new Error(`Failed to create bucket '${config.id}': ${error.message}`)
    }
    
    return data
  }

  /**
   * Set up a storage bucket (create if doesn't exist)
   */
  async setupBucket(config: StorageBucketConfig): Promise<StorageSetupResult> {
    // Check if bucket already exists
    const existingBucket = await this.bucketExists(config.id)
    
    if (existingBucket) {
      return {
        created: false,
        message: `Bucket '${config.id}' already exists`,
        bucket: existingBucket
      }
    }

    // Create the bucket
    const newBucket = await this.createBucket(config)

    return {
      created: true,
      message: `Bucket '${config.id}' created successfully`,
      bucket: newBucket
    }
  }

  /**
   * Delete a storage bucket
   */
  async deleteBucket(bucketId: string) {
    const { error } = await this.supabase.storage.deleteBucket(bucketId)
    
    if (error) {
      throw new Error(`Failed to delete bucket '${bucketId}': ${error.message}`)
    }
  }

  /**
   * List all storage buckets
   */
  async listBuckets() {
    const { data: buckets, error } = await this.supabase.storage.listBuckets()
    
    if (error) {
      throw new Error(`Failed to list buckets: ${error.message}`)
    }
    
    return buckets
  }

  /**
   * Upload a file to a bucket
   */
  async uploadFile(
    bucketId: string, 
    path: string, 
    file: File | Buffer, 
    options?: { upsert?: boolean; contentType?: string }
  ) {
    const { data, error } = await this.supabase.storage
      .from(bucketId)
      .upload(path, file, options)
    
    if (error) {
      throw new Error(`Failed to upload file to '${bucketId}/${path}': ${error.message}`)
    }
    
    return data
  }

  /**
   * Delete a file from a bucket
   */
  async deleteFile(bucketId: string, paths: string[]) {
    const { error } = await this.supabase.storage
      .from(bucketId)
      .remove(paths)
    
    if (error) {
      throw new Error(`Failed to delete files from '${bucketId}': ${error.message}`)
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucketId: string, path: string) {
    const { data } = this.supabase.storage
      .from(bucketId)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}