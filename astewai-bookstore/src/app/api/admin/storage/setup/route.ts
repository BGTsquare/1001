import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/middleware/auth-middleware'

async function setupStorageHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    // Check current buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      console.error('Failed to list existing buckets:', listError)
      return NextResponse.json({ 
        error: 'Failed to check existing buckets',
        details: listError.message 
      }, { status: 500 })
    }

    console.log('Existing buckets:', existingBuckets?.map(b => b.id))

    // Check if books bucket already exists
    const booksBucket = existingBuckets?.find(bucket => bucket.id === 'books')
    
    if (booksBucket) {
      return NextResponse.json({
        success: true,
        message: 'Books bucket already exists',
        bucket: booksBucket,
        existingBuckets: existingBuckets?.map(b => ({ id: b.id, name: b.name, public: b.public }))
      })
    }

    // Create the books bucket
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('books', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/epub+zip',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    })

    if (createError) {
      console.error('Failed to create books bucket:', createError)
      return NextResponse.json({ 
        error: 'Failed to create books bucket',
        details: createError.message,
        code: createError.statusCode || 'UNKNOWN'
      }, { status: 500 })
    }

    console.log('Books bucket created successfully:', newBucket)

    // Verify bucket was created
    const { data: updatedBuckets, error: verifyError } = await supabase.storage.listBuckets()
    if (verifyError) {
      console.error('Failed to verify bucket creation:', verifyError)
    }

    return NextResponse.json({
      success: true,
      message: 'Books bucket created successfully',
      bucket: newBucket,
      allBuckets: updatedBuckets?.map(b => ({ id: b.id, name: b.name, public: b.public }))
    })

  } catch (error) {
    console.error('Error in storage setup:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const POST = withAdminAuth(setupStorageHandler)
export const GET = withAdminAuth(setupStorageHandler) // Allow GET for easy testing