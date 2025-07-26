import { NextResponse } from 'next/server'
import { bookService } from '@/lib/books'

export async function GET() {
  try {
    const result = await bookService.getTags()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/books/tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}