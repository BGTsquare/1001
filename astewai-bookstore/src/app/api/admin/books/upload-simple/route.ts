import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Simple upload request received')
    const supabase = await createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 })
    }

    if (!profile || profile.role !== 'admin') {
      console.error('User is not admin:', profile?.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('Admin role verified')

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    console.log('Form data parsed:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type, 
      uploadType: type 
    })

    if (!file) {
      console.error('No file provided in form data')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !['cover', 'content'].includes(type)) {
      console.error('Invalid upload type:', type)
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Simple file size check (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB.' 
      }, { status: 400 })
    }

    // Generate simple filename with timestamp
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${type}s/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    console.log('Generated filename:', fileName)

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('Failed to list buckets:', bucketsError)
      return NextResponse.json({ 
        error: 'Storage service unavailable', 
        details: bucketsError.message 
      }, { status: 500 })
    }

    const booksBucket = buckets.find(bucket => bucket.id === 'books')
    if (!booksBucket) {
      console.error('Books bucket not found. Available buckets:', buckets.map(b => b.id))
      return NextResponse.json({ 
        error: 'Storage bucket not configured. Please contact administrator.',
        availableBuckets: buckets.map(b => b.id)
      }, { status: 500 })
    }

    console.log('Books bucket found, proceeding with upload...')

    // Upload file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data, error } = await supabase.storage
      .from('books')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: error.message,
        code: error.statusCode || 'UNKNOWN'
      }, { status: 500 })
    }

    console.log('File uploaded successfully:', data.path)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('books')
      .getPublicUrl(fileName)

    console.log('Generated public URL:', publicUrl)

    return NextResponse.json({ 
      url: publicUrl,
      fileName: data.path,
      size: file.size,
      type: file.type,
      originalSize: file.size
    })

  } catch (error) {
    console.error('Error in simple upload:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}