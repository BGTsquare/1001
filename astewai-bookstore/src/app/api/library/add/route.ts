import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bookService } from '@/lib/services/book-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookId } = body

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Verify the book exists
    const bookResult = await bookService.getBookById(bookId)
    
    if (!bookResult.success || !bookResult.data) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    const book = bookResult.data

    // For paid books, add to wishlist instead of library
    const status = book.is_free ? 'owned' : 'pending'

    // Check if book is already in user's library
    const { data: existingEntry } = await supabase
      .from('user_library')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .single()

    if (existingEntry) {
      return NextResponse.json(
        { 
          error: existingEntry.status === 'owned' 
            ? 'Book is already in your library' 
            : 'Book is already in your wishlist'
        },
        { status: 409 }
      )
    }

    // Add book to user's library
    const { data: libraryEntry, error: insertError } = await supabase
      .from('user_library')
      .insert({
        user_id: user.id,
        book_id: bookId,
        status,
        progress: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding book to library:', insertError)
      return NextResponse.json(
        { error: 'Failed to add book to library' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: book.is_free 
        ? 'Book added to your library successfully!' 
        : 'Book added to your wishlist!',
      libraryEntry,
    })

  } catch (error) {
    console.error('Error in add to library API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}