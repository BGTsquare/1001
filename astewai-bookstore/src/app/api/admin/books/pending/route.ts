import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // For now, we'll simulate pending books by returning all books
    // In a real implementation, you would have a status field or separate table
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending books:', error)
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
    }

    // Simulate book statuses for demonstration
    const booksWithStatus = books.map(book => ({
      ...book,
      status: Math.random() > 0.7 ? 'pending' : 'approved', // Random status for demo
      submitted_at: book.created_at,
      reviewed_at: Math.random() > 0.5 ? book.updated_at : null,
      reviewer_notes: Math.random() > 0.8 ? 'Looks good for publication' : null
    }))

    return NextResponse.json({
      books: booksWithStatus,
      total: booksWithStatus.length
    })

  } catch (error) {
    console.error('Error in GET /api/admin/books/pending:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}