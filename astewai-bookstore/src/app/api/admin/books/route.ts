import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    console.log('=== GET /api/admin/books called ===')
    
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    console.log('Query params:', { limit, offset, sortBy, sortOrder })

    // Get books using admin client
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (booksError) {
      console.error('Error fetching books:', booksError)
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
    }

    // Get total count
    const { count, error: countError } = await supabaseAdmin
      .from('books')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting books:', countError)
      return NextResponse.json({ error: 'Failed to count books' }, { status: 500 })
    }

    console.log(`✅ Fetched ${books.length} books, total: ${count}`)

    return NextResponse.json({
      books: books || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('❌ Error in GET /api/admin/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/admin/books called ===')
    
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const bookData = await request.json()
    console.log('Book data received:', { 
      title: bookData.title, 
      author: bookData.author,
      hasContent: !!bookData.content_url,
      hasCover: !!bookData.cover_image_url
    })

    // Create book using admin client
    const { data: newBook, error: createError } = await supabaseAdmin
      .from('books')
      .insert(bookData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating book:', createError)
      return NextResponse.json({ 
        error: 'Failed to create book',
        details: createError.message 
      }, { status: 500 })
    }

    console.log('✅ Book created successfully:', newBook.id)

    return NextResponse.json(newBook, { status: 201 })

  } catch (error) {
    console.error('❌ Error in POST /api/admin/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}