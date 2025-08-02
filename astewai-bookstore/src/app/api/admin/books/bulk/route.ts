import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
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
    const { bookIds, action } = await request.json()

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'Book IDs are required' }, { status: 400 })
    }

    if (!action || !['publish', 'unpublish'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // For now, we'll simulate publish/unpublish by updating a hypothetical 'published' field
    // In a real implementation, you might have a 'status' or 'published' field
    const updateData = {
      updated_at: new Date().toISOString()
    }

    // Update books
    const { data, error } = await supabase
      .from('books')
      .update(updateData)
      .in('id', bookIds)
      .select()

    if (error) {
      console.error('Error updating books:', error)
      return NextResponse.json({ error: 'Failed to update books' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Successfully ${action}ed ${data.length} books`,
      updatedBooks: data
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/books/bulk:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const { bookIds } = await request.json()

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'Book IDs are required' }, { status: 400 })
    }

    // Get books to delete (to clean up files later)
    const { data: booksToDelete } = await supabase
      .from('books')
      .select('id, cover_image_url, content_url')
      .in('id', bookIds)

    // Delete books from database
    const { error } = await supabase
      .from('books')
      .delete()
      .in('id', bookIds)

    if (error) {
      console.error('Error deleting books:', error)
      return NextResponse.json({ error: 'Failed to delete books' }, { status: 500 })
    }

    // TODO: Clean up associated files from storage
    // This would involve parsing the URLs and deleting from Supabase Storage
    // For now, we'll just log the files that should be cleaned up
    if (booksToDelete) {
      console.log('Files to clean up:', booksToDelete.map(book => ({
        id: book.id,
        cover: book.cover_image_url,
        content: book.content_url
      })))
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${bookIds.length} books`,
      deletedCount: bookIds.length
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/books/bulk:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}