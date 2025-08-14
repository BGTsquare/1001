import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/middleware/auth-middleware'
import { bookService } from '@/lib/services/book-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = withAdminAuth(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const result = await bookService.getBookById(id)

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
})

export const PUT = withAdminAuth(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const updateData = await request.json()
    
    const result = await bookService.updateBook(id, updateData)

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
})

export const DELETE = withAdminAuth(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const result = await bookService.deleteBook(id)

    if (!result.success) {
      const status = result.error === 'Book not found' ? 404 : 400
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})