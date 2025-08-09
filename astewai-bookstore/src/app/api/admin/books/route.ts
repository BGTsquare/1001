import { NextRequest, NextResponse } from 'next/server'
import { BookService } from '@/lib/services/book-service'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/middleware/auth-middleware'

export const GET = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('query') || searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const isFree = searchParams.get('is_free') ? searchParams.get('is_free') === 'true' : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const sortBy = (searchParams.get('sortBy') as any) || 'created_at'
    const sortOrder = (searchParams.get('sortOrder') as any) || 'desc'

    // Get books using service
    const bookService = new BookService()
    const result = await bookService.searchBooks({
      query: search || '',
      category,
      isFree,
      limit,
      offset,
      sortBy,
      sortOrder
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      books: result.data?.books || [],
      total: result.data?.total || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in GET /api/admin/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    // Parse request body
    const bookData = await request.json()

    // Create book using service
    const bookService = new BookService()
    const result = await bookService.createBook(bookData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})