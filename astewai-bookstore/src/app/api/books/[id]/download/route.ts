import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookService } from '@/lib/services/book-service'
import { libraryService } from '@/lib/services/library-service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get book details
    const bookResult = await bookService.getBookById(id)

    if (!bookResult.success || !bookResult.data) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    const book = bookResult.data

    // Check if user owns the book or if it's free
    if (!book.is_free) {
      const ownershipResult = await libraryService.checkBookOwnership(user.id, id)

      if (!ownershipResult.success || !ownershipResult.data?.owned) {
        return NextResponse.json(
          { error: 'You do not own this book' },
          { status: 403 }
        )
      }
    }

    // Check if book has content
    if (!book.content_url) {
      return NextResponse.json(
        { error: 'Book content not available' },
        { status: 404 }
      )
    }

    try {
      // Extract file path from content_url if it's a full URL
      let filePath = book.content_url
      if (filePath.includes('/storage/v1/object/')) {
        // Extract the path after the bucket name
        const parts = filePath.split('/book-content/')
        if (parts.length > 1) {
          filePath = parts[1]
        }
      }

      // Download the content from Supabase storage
      const { data: contentData, error: storageError } = await supabase.storage
        .from('book-content')
        .download(filePath)

      if (storageError || !contentData) {
        console.error('Storage error:', storageError)
        return NextResponse.json(
          { error: 'Failed to load book content' },
          { status: 500 }
        )
      }

      // Determine file extension and content type
      const fileExtension = filePath.split('.').pop()?.toLowerCase()
      const contentType = contentData.type

      // Set appropriate headers for download
      const headers = new Headers()
      
      if (contentType === 'application/pdf' || fileExtension === 'pdf') {
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="${book.title}.pdf"`)
      } else if (contentType === 'application/epub+zip' || fileExtension === 'epub') {
        headers.set('Content-Type', 'application/epub+zip')
        headers.set('Content-Disposition', `attachment; filename="${book.title}.epub"`)
      } else {
        headers.set('Content-Type', contentType || 'application/octet-stream')
        headers.set('Content-Disposition', `attachment; filename="${book.title}.${fileExtension || 'txt'}"`)
      }

      // Convert blob to array buffer for response
      const arrayBuffer = await contentData.arrayBuffer()

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers
      })

    } catch (contentError) {
      console.error('Error processing book download:', contentError)
      return NextResponse.json(
        { error: 'Failed to process book download' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in book download:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}