import { NextRequest, NextResponse } from 'next/server'
import { bookService } from '@/lib/books'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const searchOptions = {
      query: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      isFree: searchParams.get('isFree') ? searchParams.get('isFree') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      sortBy: (searchParams.get('sortBy') as 'created_at' | 'title' | 'author' | 'price') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      priceRange: searchParams.get('minPrice') && searchParams.get('maxPrice') 
        ? [parseFloat(searchParams.get('minPrice')!), parseFloat(searchParams.get('maxPrice')!)] as [number, number]
        : undefined
    }

    const result = await bookService.searchBooks(searchOptions)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await bookService.createBook(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, validationErrors: result.validationErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}