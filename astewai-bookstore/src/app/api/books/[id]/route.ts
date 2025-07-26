import { NextRequest, NextResponse } from 'next/server'
import { bookService } from '@/lib/books'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    console.error('Error in GET /api/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const result = await bookService.updateBook(id, body)

    if (!result.success) {
      const status = result.error === 'Book not found' ? 404 : 400
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in PUT /api/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    console.error('Error in DELETE /api/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}