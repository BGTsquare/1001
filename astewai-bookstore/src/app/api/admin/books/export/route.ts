import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Get books data
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .in('id', bookIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching books for export:', error)
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
    }

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Title',
      'Author',
      'Description',
      'Category',
      'Price',
      'Is Free',
      'Tags',
      'Cover Image URL',
      'Content URL',
      'Created At',
      'Updated At'
    ]

    const csvRows = books.map(book => [
      book.id,
      `"${(book.title || '').replace(/"/g, '""')}"`,
      `"${(book.author || '').replace(/"/g, '""')}"`,
      `"${(book.description || '').replace(/"/g, '""')}"`,
      book.category || '',
      book.price || 0,
      book.is_free ? 'Yes' : 'No',
      `"${(book.tags || []).join(', ')}"`,
      book.cover_image_url || '',
      book.content_url || '',
      book.created_at,
      book.updated_at
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="books-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error in POST /api/admin/books/export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}