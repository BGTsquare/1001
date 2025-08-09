import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('Simple storage status check started')
    
    // Test Supabase connection
    const supabase = await createClient()
    console.log('Supabase client created')

    // Try to list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Buckets error:', bucketsError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to list buckets',
        details: bucketsError.message,
        code: bucketsError.statusCode || 'UNKNOWN'
      }, { status: 500 })
    }

    console.log('Buckets retrieved:', buckets?.length || 0)

    // Check if books bucket exists
    const booksBucket = buckets?.find(bucket => bucket.id === 'books')
    console.log('Books bucket exists:', !!booksBucket)

    return NextResponse.json({
      success: true,
      message: 'Simple storage status check completed',
      storage: {
        totalBuckets: buckets?.length || 0,
        booksBucketExists: !!booksBucket,
        allBuckets: buckets?.map(b => ({ id: b.id, name: b.name })) || []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Simple storage status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Simple storage status failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}