import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('=== STORAGE SETUP API CALLED ===')
    
    // Check authentication with user client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('Admin authentication verified')

    // Use admin client for storage operations
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    if (listError) {
      console.error('Failed to list existing buckets:', listError)
      return NextResponse.json({ 
        error: 'Failed to check existing buckets',
        details: listError.message 
      }, { status: 500 })
    }

    console.log('Existing buckets:', existingBuckets?.map(b => b.id))

    // Define required buckets
    const requiredBuckets = [
      {
        id: 'book-covers',
        name: 'book-covers',
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      },
      {
        id: 'book-content',
        name: 'book-content',
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf', 'application/epub+zip', 'text/plain', 'application/zip']
      },
      {
        id: 'blog-images',
        name: 'blog-images',
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      },
      {
        id: 'avatars',
        name: 'avatars',
        public: true,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    ]

    const createdBuckets = []
    const existingBucketIds = existingBuckets?.map(b => b.id) || []

    // Create missing buckets using admin client
    for (const bucketConfig of requiredBuckets) {
      if (existingBucketIds.includes(bucketConfig.id)) {
        console.log(`Bucket ${bucketConfig.id} already exists`)
        createdBuckets.push({ ...bucketConfig, status: 'exists' })
        continue
      }

      console.log(`Creating bucket: ${bucketConfig.id}`)
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketConfig.id, {
        public: bucketConfig.public,
        fileSizeLimit: bucketConfig.fileSizeLimit,
        allowedMimeTypes: bucketConfig.allowedMimeTypes
      })

      if (createError) {
        console.error(`Failed to create ${bucketConfig.id} bucket:`, createError)
        createdBuckets.push({ ...bucketConfig, status: 'error', error: createError.message })
      } else {
        console.log(`${bucketConfig.id} bucket created successfully`)
        createdBuckets.push({ ...bucketConfig, status: 'created' })
      }
    }

    // Verify final bucket state
    const { data: finalBuckets, error: verifyError } = await supabaseAdmin.storage.listBuckets()
    if (verifyError) {
      console.error('Failed to verify bucket creation:', verifyError)
    }

    const hasAllRequiredBuckets = requiredBuckets.every(required => 
      finalBuckets?.some(bucket => bucket.id === required.id)
    )

    console.log('=== STORAGE SETUP COMPLETED ===')

    return NextResponse.json({
      success: hasAllRequiredBuckets,
      message: hasAllRequiredBuckets 
        ? 'All storage buckets are configured' 
        : 'Some buckets failed to create',
      buckets: createdBuckets,
      allBuckets: finalBuckets?.map(b => ({ id: b.id, name: b.name, public: b.public }))
    })

  } catch (error) {
    console.error('Error in storage setup:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const GET = POST // Allow GET for easy testing