import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BookService } from '@/lib/services/book-service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get book using service
    const bookService = new BookService()
    const result = await bookService.getBookById(params.id)

    if (!result.success) {
      const status = result.error === 'Book not found' ? 404 : 400
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status }
      )
    }

    return NextResponse.json(result.data)

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
    const updateData = await request.json()

    // Update book using service
    const bookService = new BookService()
    const result = await bookService.updateBook(params.id, updateData)

    if (!result.success) {
      const status = result.error === 'Book not found' ? 404 : 400
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status }
      )
    }

    return NextResponse.json(result.data)

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

    // Delete book using service
    const bookService = new BookService()
    const result = await bookService.deleteBook(params.id)

    if (!result.success) {
      const status = result.error === 'Book not found' ? 404 : 400
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status }
      )
    }

    return NextResponse.json({ message: 'Book deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}