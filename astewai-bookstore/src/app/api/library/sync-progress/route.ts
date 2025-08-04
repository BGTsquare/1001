import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReadingProgressUpdate } from '@/lib/types/library'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookId, progress, lastReadPosition, status }: {
      bookId: string
      progress: number
      lastReadPosition?: string
      status?: 'owned' | 'pending' | 'completed'
    } = body

    if (!bookId || typeof progress !== 'number') {
      return NextResponse.json(
        { error: 'Book ID and progress are required' },
        { status: 400 }
      )
    }

    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Update reading progress in database
    const updateData: any = {
      progress,
      updated_at: new Date().toISOString()
    }

    if (lastReadPosition !== undefined) {
      updateData.last_read_position = lastReadPosition
    }

    if (status) {
      updateData.status = status
    }

    // Auto-complete book if progress is 100%
    if (progress >= 100 && !status) {
      updateData.status = 'completed'
    }

    const { data, error } = await supabase
      .from('user_library')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .select(`
        *,
        book:books(title, author)
      `)
      .single()

    if (error) {
      console.error('Failed to sync reading progress:', error)
      return NextResponse.json(
        { error: 'Failed to sync progress' },
        { status: 500 }
      )
    }

    // If book was completed, trigger achievement/notification
    if (updateData.status === 'completed' && data.status !== 'completed') {
      // This could trigger additional logic like:
      // - Achievement unlocking
      // - Recommendation updates
      // - Social sharing prompts
      console.log(`User ${user.id} completed book ${bookId}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        bookId: data.book_id,
        progress: data.progress,
        lastReadPosition: data.last_read_position,
        status: data.status,
        updatedAt: data.updated_at,
        book: data.book
      }
    })
  } catch (error) {
    console.error('Error syncing reading progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Get current reading progress
    const { data, error } = await supabase
      .from('user_library')
      .select(`
        *,
        book:books(title, author)
      `)
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Book not found in library' },
          { status: 404 }
        )
      }
      console.error('Failed to fetch reading progress:', error)
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        bookId: data.book_id,
        progress: data.progress,
        lastReadPosition: data.last_read_position,
        status: data.status,
        addedAt: data.added_at,
        updatedAt: data.updated_at,
        book: data.book
      }
    })
  } catch (error) {
    console.error('Error fetching reading progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}