import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  console.log('=== UPLOAD API CALLED ===')
  
  try {
    console.log('1. Creating Supabase client...')
    const supabase = await createClient()
    console.log('✓ Supabase client created')
    
    console.log('2. Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('❌ Auth error:', authError)
      
      // Check if it's a network timeout error
      if (authError.message?.includes('fetch failed') || authError.message?.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Network timeout. Please check your connection and try again.', 
          details: 'Connection to authentication service timed out'
        }, { status: 503 }) // Service Unavailable
      }
      
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✓ User authenticated:', user.id)

    console.log('3. Checking admin role...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to verify user role', 
        details: profileError.message 
      }, { status: 500 })
    }

    if (!profile || profile.role !== 'admin') {
      console.error('❌ User is not admin:', profile?.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✓ Admin role verified')

    console.log('4. Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    console.log('Form data:', { 
      hasFile: !!file,
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type, 
      uploadType: type 
    })

    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !['cover', 'content'].includes(type)) {
      console.error('❌ Invalid upload type:', type)
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // File size check
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size)
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB.' 
      }, { status: 400 })
    }

    console.log('✓ File validation passed')

    console.log('5. Checking storage buckets with admin client...')
    const bucketName = type === 'cover' ? 'book-covers' : 'book-content'
    console.log('Target bucket:', bucketName)
    
    // Use admin client for storage operations
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError)
      return NextResponse.json({ 
        error: 'Storage service unavailable', 
        details: bucketsError.message 
      }, { status: 500 })
    }

    console.log('Available buckets:', buckets.map(b => b.id))
    
    const targetBucket = buckets.find(bucket => bucket.id === bucketName)
    if (!targetBucket) {
      console.error('❌ Target bucket not found:', bucketName)
      return NextResponse.json({ 
        error: 'Storage bucket not configured. Please contact administrator.',
        availableBuckets: buckets.map(b => b.id),
        requestedBucket: bucketName
      }, { status: 500 })
    }

    console.log('✓ Target bucket found')

    console.log('6. Preparing file upload...')
    const timestamp = Date.now()
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const finalFileName = `${timestamp}-${cleanName}`
    console.log('Generated filename:', finalFileName)

    console.log('7. Converting file to buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    console.log('✓ File converted to buffer, size:', buffer.length)

    console.log('8. Uploading to storage with admin client...')
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(finalFileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('❌ Storage upload error:', error)
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: error.message,
        code: error.statusCode || 'UNKNOWN'
      }, { status: 500 })
    }

    console.log('✓ File uploaded successfully:', data.path)

    console.log('9. Generating public URL with admin client...')
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(finalFileName)

    console.log('✓ Public URL generated:', publicUrl)

    const response = { 
      url: publicUrl,
      fileName: data.path,
      size: file.size,
      type: file.type,
      originalSize: file.size
    }

    console.log('✓ Upload completed successfully')
    console.log('=== UPLOAD API SUCCESS ===')
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ CRITICAL ERROR in upload API:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('=== UPLOAD API FAILED ===')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}