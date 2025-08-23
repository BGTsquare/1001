import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    console.log('Testing Supabase admin client...')
    
    // Test 1: Check if admin client is initialized
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Supabase admin client not initialized' 
      }, { status: 500 })
    }
    
    // Test 2: Check environment variables
    const envCheck = {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
    }
    
    console.log('Environment check:', envCheck)
    
    // Test 3: Try to list storage buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Buckets error:', bucketsError)
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: bucketsError.message,
        envCheck
      }, { status: 500 })
    }
    
    console.log('Buckets found:', buckets?.map(b => b.name))
    
    // Test 4: Check if 'books' bucket exists
    const booksBucket = buckets?.find(bucket => bucket.name === 'books')
    
    return NextResponse.json({
      success: true,
      envCheck,
      buckets: buckets?.map(b => ({ name: b.name, id: b.id, public: b.public })),
      booksBucketExists: !!booksBucket,
      message: 'Supabase admin client is working correctly'
    })
    
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({ 
      error: 'Supabase test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
