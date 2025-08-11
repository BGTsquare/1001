import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body
    const { notes } = await request.json()

    if (!notes || notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection notes are required' },
        { status: 400 }
      )
    }

    // Check if book exists
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // In a real implementation, you would update a status field or approval table
    // For now, we'll just update the updated_at timestamp to simulate rejection
    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update({
        updated_at: new Date().toISOString()
        // In a real implementation, you might add:
        // status: 'rejected',
        // rejected_at: new Date().toISOString(),
        // rejected_by: user.id,
        // rejection_notes: notes
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error rejecting book:', updateError)
      return NextResponse.json({ error: 'Failed to reject book' }, { status: 500 })
    }

    // TODO: Send notification to book author about rejection with feedback
    // TODO: Optionally move book back to draft status for revision

    return NextResponse.json({
      message: 'Book rejected',
      book: updatedBook,
      rejectedBy: user.id,
      rejectedAt: new Date().toISOString(),
      notes
    })

  } catch (error) {
    console.error('Error in POST /api/admin/books/[id]/reject:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}