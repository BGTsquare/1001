import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bundleService } from '@/lib/services/bundle-service'
import type { 
  CreateBundleWithBooksRequest, 
  CreateBundleWithBooksResponse, 
  BundleApiError,
  BundleCreateData 
} from '@/types/bundle-api'

export async function POST(request: NextRequest) {
  try {
    // Check content length to prevent large payloads
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'Request payload too large' }, { status: 413 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: CreateBundleWithBooksRequest = await request.json()
    const { title, description, price, cover_image_url, books } = body

    // Enhanced input validation
    if (!title?.trim()) {
      return NextResponse.json({ 
        error: 'Title is required and cannot be empty' 
      }, { status: 400 })
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return NextResponse.json({ 
        error: 'Valid price greater than 0 is required' 
      }, { status: 400 })
    }

    if (!books || !Array.isArray(books) || books.length === 0) {
      return NextResponse.json({ 
        error: 'At least one book is required' 
      }, { status: 400 })
    }

    // Validate each book has required fields
    for (let i = 0; i < books.length; i++) {
      const book = books[i]
      if (!book.title || !book.author || !book.cover_image_url || !book.content_url) {
        return NextResponse.json({ 
          error: `Book ${i + 1} is missing required fields (title, author, cover_image_url, content_url)` 
        }, { status: 400 })
      }
    }

    // Create books first (will be cleaned up if bundle creation fails)
    // Mark books as bundle-only so they don't appear in the main catalog
    const booksWithBundleFlag = books.map(book => ({
      ...book,
      bundle_only: true
    }))

    const { data: createdBooks, error: booksError } = await supabase
      .from('books')
      .insert(booksWithBundleFlag)
      .select('id, title, author, price')

    if (booksError || !createdBooks) {
      console.error('Error creating books:', booksError)
      return NextResponse.json({ 
        error: `Failed to create books: ${booksError?.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    // Create the bundle with the new book IDs
    const bookIds = createdBooks.map(book => book.id)
    const bundleData: BundleCreateData = {
      title,
      description: description || null,
      price: typeof price === 'string' ? parseFloat(price) : price,
      bookIds,
      ...(cover_image_url && { cover_image_url })
    }
    const result = await bundleService.createBundle(bundleData)

    if (!result.success) {
      // If bundle creation fails, clean up the created books
      try {
        await supabase
          .from('books')
          .delete()
          .in('id', bookIds)
      } catch (cleanupError) {
        console.error('Failed to cleanup books after bundle creation failure:', cleanupError)
        // Continue with error response even if cleanup fails
      }

      return NextResponse.json({ 
        error: result.error || 'Failed to create bundle',
        ...(result.validationErrors && { validationErrors: result.validationErrors })
      }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error creating bundle with books:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}