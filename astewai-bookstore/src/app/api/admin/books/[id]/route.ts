import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
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

    // Get book using admin client
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (bookError) {
      console.error('Error fetching book:', bookError)
      if (bookError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 })
    }

    return NextResponse.json(book)

  } catch (error) {
    console.error('Error in GET /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
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
    const updateData = await request.json()
    console.log('Updating book:', id, 'with data:', Object.keys(updateData))

    // Update book using admin client
    const { data: updatedBook, error: updateError } = await supabaseAdmin
      .from('books')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating book:', updateError)
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 })
      }
      return NextResponse.json({ 
        error: 'Failed to update book',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ Book updated successfully:', updatedBook.id)
    return NextResponse.json(updatedBook)

  } catch (error) {
    console.error('Error in PUT /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
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

    // Delete book using admin client
    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting book:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete book',
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('✅ Book deleted successfully:', id)
    return NextResponse.json({ message: 'Book deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}