import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    console.log('=== SETTING UP STORAGE BUCKETS ===')
    
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
        id: 'books',
        name: 'books',
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/epub+zip']
      }
    ]

    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    if (listError) {
      console.error('Failed to list existing buckets:', listError)
      return NextResponse.json({ 
        error: 'Failed to check existing buckets',
        details: listError.message 
      }, { status: 500 })
    }

    console.log('Existing buckets:', existingBuckets?.map(b => b.id))

    const results = []
    
    for (const bucket of requiredBuckets) {
      const exists = existingBuckets?.some(existing => existing.id === bucket.id)
      
      if (exists) {
        console.log(`✓ Bucket '${bucket.id}' already exists`)
        results.push({
          bucket: bucket.id,
          action: 'exists',
          success: true
        })
        continue
      }

      console.log(`Creating bucket '${bucket.id}'...`)
      
      const { data, error } = await supabaseAdmin.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      })

      if (error) {
        console.error(`❌ Failed to create bucket '${bucket.id}':`, error)
        results.push({
          bucket: bucket.id,
          action: 'create',
          success: false,
          error: error.message
        })
      } else {
        console.log(`✓ Created bucket '${bucket.id}'`)
        results.push({
          bucket: bucket.id,
          action: 'create',
          success: true,
          data
        })
      }
    }

    const allSuccessful = results.every(r => r.success)
    
    return NextResponse.json({
      success: allSuccessful,
      results,
      message: allSuccessful 
        ? 'All storage buckets are ready' 
        : 'Some buckets failed to create'
    }, { 
      status: allSuccessful ? 200 : 207 // 207 = Multi-Status
    })

  } catch (error) {
    console.error('Storage setup error:', error)
    return NextResponse.json({ 
      error: 'Storage setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
