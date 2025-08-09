import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/middleware/auth-middleware'

async function getStorageStatusHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    // Get all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('Failed to list buckets:', bucketsError)
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: bucketsError.message 
      }, { status: 500 })
    }

    // Check if books bucket exists
    const booksBucket = buckets?.find(bucket => bucket.id === 'books')
    
    // If books bucket exists, get some info about it
    let bucketInfo = null
    if (booksBucket) {
      try {
        // Try to list files in the bucket (just to test access)
        const { data: files, error: filesError } = await supabase.storage
          .from('books')
          .list('', { limit: 5 })
        
        bucketInfo = {
          ...booksBucket,
          accessible: !filesError,
          fileCount: files?.length || 0,
          sampleFiles: files?.slice(0, 3).map(f => ({ name: f.name, size: f.metadata?.size })) || [],
          error: filesError?.message
        }
      } catch (error) {
        bucketInfo = {
          ...booksBucket,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      storage: {
        totalBuckets: buckets?.length || 0,
        allBuckets: buckets?.map(b => ({ 
          id: b.id, 
          name: b.name, 
          public: b.public,
          fileSizeLimit: b.file_size_limit,
          allowedMimeTypes: b.allowed_mime_types
        })) || [],
        booksBucket: bucketInfo,
        booksBucketExists: !!booksBucket,
        booksBucketAccessible: bucketInfo?.accessible || false
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error checking storage status:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const GET = withAdminAuth(getStorageStatusHandler)