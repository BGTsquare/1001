import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateFile, generateUniqueFileName } from '@/lib/storage/file-validation'
import { optimizeImage, createThumbnail } from '@/lib/storage/image-processing'
import { FileType } from '@/lib/storage/types'

// Types
interface ApiError {
  message: string
  status: number
  code?: string
}

interface UploadResponse {
  url: string
  fileName: string
  size: number
  type: string
  thumbnailUrl?: string
  optimized: boolean
  originalSize: number
}

// Centralized error handler
function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    switch (error.message) {
      case 'Unauthorized':
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      case 'Forbidden':
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      case 'No file provided':
      case 'Invalid file type':
        return NextResponse.json({ error: error.message }, { status: 400 })
      case 'Failed to verify user role':
        return NextResponse.json({ error: error.message }, { status: 500 })
      default:
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

// File processing helper
async function processUploadFile(
  file: File, 
  type: string, 
  options: { optimize: boolean; generateThumb: boolean }
): Promise<{ processedFile: File; thumbnailFile: File | null }> {
  const fileType: FileType = type === 'cover' ? 'image' : 'book'
  
  // Validate file
  const validation = validateFile(file, fileType)
  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
  }
  console.log('File validation passed')

  let processedFile = file
  let thumbnailFile: File | null = null

  // Optimize image if requested and it's an image
  if (options.optimize && type === 'cover' && file.type.startsWith('image/')) {
    try {
      console.log('Starting image optimization...')
      processedFile = await optimizeImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        format: 'webp'
      })
      console.log('Image optimization completed')
    } catch (error) {
      console.warn('Image optimization failed, using original file:', error)
    }
  }

  // Generate thumbnail if requested and it's an image
  if (options.generateThumb && type === 'cover' && file.type.startsWith('image/')) {
    try {
      console.log('Starting thumbnail generation...')
      thumbnailFile = await createThumbnail(file, 200)
      console.log('Thumbnail generation completed')
    } catch (error) {
      console.warn('Thumbnail generation failed:', error)
    }
  }

  return { processedFile, thumbnailFile }
}

// Storage upload helper
async function uploadFilesToStorage(
  supabase: any,
  processedFile: File,
  thumbnailFile: File | null,
  type: string
): Promise<{ publicUrl: string; thumbnailUrl?: string; uploadedPath: string }> {
  // Generate unique filenames
  const fileName = generateUniqueFileName(processedFile.name, `${type}s`)
  const thumbnailFileName = thumbnailFile 
    ? generateUniqueFileName(`thumb_${thumbnailFile.name}`, `${type}s/thumbnails`)
    : undefined

  console.log('Generated filenames:', { fileName, thumbnailFileName })

  // Verify bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  if (bucketsError) {
    throw new Error(`Storage service unavailable: ${bucketsError.message}`)
  }

  const booksBucket = buckets.find((bucket: any) => bucket.id === 'books')
  if (!booksBucket) {
    throw new Error('Storage bucket not configured. Please contact administrator.')
  }

  // Upload main file
  console.log('Uploading main file:', fileName)
  const arrayBuffer = await processedFile.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabase.storage
    .from('books')
    .upload(fileName, buffer, {
      contentType: processedFile.type,
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  console.log('File uploaded successfully:', data.path)

  // Get public URL for main file
  const { data: { publicUrl } } = supabase.storage
    .from('books')
    .getPublicUrl(fileName)

  // Upload thumbnail if available
  let thumbnailUrl: string | undefined
  if (thumbnailFile && thumbnailFileName) {
    try {
      console.log('Uploading thumbnail:', thumbnailFileName)
      const thumbArrayBuffer = await thumbnailFile.arrayBuffer()
      const thumbBuffer = new Uint8Array(thumbArrayBuffer)

      const { error: thumbError } = await supabase.storage
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
        console.log('Thumbnail uploaded successfully')
      }
    } catch (error) {
      console.warn('Thumbnail upload failed:', error)
    }
  }

  return { publicUrl, thumbnailUrl, uploadedPath: data.path }
}

// Authentication helper
async function verifyAdminUser(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error('Failed to verify user role')
  }

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden')
  }

  return user
}

// Form data parsing helper
function parseUploadFormData(formData: FormData) {
  const file = formData.get('file') as File
  const type = formData.get('type') as string
  const optimize = formData.get('optimize') === 'true'
  const generateThumb = formData.get('generateThumbnail') === 'true'

  if (!file) {
    throw new Error('No file provided')
  }

  if (!type || !['cover', 'content'].includes(type)) {
    throw new Error('Invalid file type')
  }

  return { file, type, optimize, generateThumb }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received')
    const supabase = await createClient()
    
    // Verify admin authentication
    const user = await verifyAdminUser(supabase)
    console.log('Admin user verified:', user.id)

    // Parse and validate form data
    const formData = await request.formData()
    const { file, type, optimize, generateThumb } = parseUploadFormData(formData)

    console.log('Form data parsed:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type, 
      uploadType: type 
    })

    // Process file (validation, optimization, thumbnail generation)
    const { processedFile, thumbnailFile } = await processUploadFile(file, type, { optimize, generateThumb })

    // Upload files to storage
    const { publicUrl, thumbnailUrl, uploadedPath } = await uploadFilesToStorage(
      supabase, 
      processedFile, 
      thumbnailFile, 
      type
    )

    // Log upload activity
    console.log(`File uploaded by admin ${user.id}: ${uploadedPath} (${processedFile.size} bytes)`)

    return NextResponse.json({ 
      url: publicUrl,
      fileName: uploadedPath,
      size: processedFile.size,
      type: processedFile.type,
      thumbnailUrl,
      optimized: optimize && processedFile !== file,
      originalSize: file.size
    })

  } catch (error) {
    return handleApiError(error)
  }
}