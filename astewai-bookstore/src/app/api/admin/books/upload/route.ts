import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateFile, generateUniqueFileName } from '@/lib/storage/file-validation'
import { optimizeImage, createThumbnail } from '@/lib/storage/image-processing'
import { FileType } from '@/lib/storage/types'

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
    const optimize = formData.get('optimize') === 'true'
    const generateThumb = formData.get('generateThumbnail') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !['cover', 'content'].includes(type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Map upload type to FileType
    const fileType: FileType = type === 'cover' ? 'image' : 'book'
    
    // Validate file using enhanced validation
    const validation = validateFile(file, fileType)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: `File validation failed: ${validation.errors.join(', ')}` 
      }, { status: 400 })
    }

    let processedFile = file
    let thumbnailFile: File | null = null

    // Optimize image if requested and it's an image
    if (optimize && type === 'cover' && file.type.startsWith('image/')) {
      try {
        processedFile = await optimizeImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          format: 'webp'
        })
      } catch (error) {
        console.warn('Image optimization failed, using original file:', error)
      }
    }

    // Generate thumbnail if requested and it's an image
    if (generateThumb && type === 'cover' && file.type.startsWith('image/')) {
      try {
        thumbnailFile = await createThumbnail(file, 200)
      } catch (error) {
        console.warn('Thumbnail generation failed:', error)
      }
    }

    // Generate unique filenames
    const fileName = generateUniqueFileName(processedFile.name, `${type}s`)
    const thumbnailFileName = thumbnailFile 
      ? generateUniqueFileName(`thumb_${thumbnailFile.name}`, `${type}s/thumbnails`)
      : undefined

    // Upload main file
    const arrayBuffer = await processedFile.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data, error } = await supabase.storage
      .from('books')
      .upload(fileName, buffer, {
        contentType: processedFile.type,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL for main file
    const { data: { publicUrl } } = supabase.storage
      .from('books')
      .getPublicUrl(fileName)

    // Upload thumbnail if available
    let thumbnailUrl: string | undefined
    if (thumbnailFile && thumbnailFileName) {
      try {
        const thumbArrayBuffer = await thumbnailFile.arrayBuffer()
        const thumbBuffer = new Uint8Array(thumbArrayBuffer)

        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('books')
          .upload(thumbnailFileName, thumbBuffer, {
            contentType: thumbnailFile.type,
            upsert: false
          })

        if (!thumbError) {
          const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
            .from('books')
            .getPublicUrl(thumbnailFileName)
          thumbnailUrl = thumbPublicUrl
        }
      } catch (error) {
        console.warn('Thumbnail upload failed:', error)
      }
    }

    // Log upload activity
    console.log(`File uploaded by admin ${user.id}: ${fileName} (${processedFile.size} bytes)`)

    return NextResponse.json({ 
      url: publicUrl,
      fileName: data.path,
      size: processedFile.size,
      type: processedFile.type,
      thumbnailUrl,
      optimized: optimize && processedFile !== file,
      originalSize: file.size
    })

  } catch (error) {
    console.error('Error in POST /api/admin/books/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}