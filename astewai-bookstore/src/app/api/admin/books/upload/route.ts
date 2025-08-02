import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !['cover', 'content'].includes(type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file type
    if (type === 'cover') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Cover must be an image file' }, { status: 400 })
      }
      // Check file size (max 5MB for images)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Cover image must be less than 5MB' }, { status: 400 })
      }
    } else if (type === 'content') {
      const allowedTypes = [
        'application/pdf',
        'application/epub+zip',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: 'Content file must be PDF, EPUB, TXT, or DOCX' 
        }, { status: 400 })
      }
      // Check file size (max 50MB for content)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'Content file must be less than 50MB' }, { status: 400 })
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${type}s/${timestamp}-${randomString}.${fileExtension}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('books')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('books')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      url: publicUrl,
      fileName: data.path,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error in POST /api/admin/books/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}