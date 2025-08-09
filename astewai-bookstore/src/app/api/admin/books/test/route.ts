import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple test endpoint to verify admin books API routing works
    const mockBooks = [
      {
        id: '1',
        title: 'Test Book 1',
        author: 'Test Author 1',
        description: 'A test book for admin management',
        price: 9.99,
        is_free: false,
        category: 'Fiction',
        tags: ['test', 'fiction'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cover_image_url: null,
        content_url: null,
        isbn: null,
        publisher: null,
        published_date: null,
        page_count: 200,
        language: 'en',
        rating: 4.5,
        rating_count: 10
      },
      {
        id: '2',
        title: 'Test Book 2',
        author: 'Test Author 2',
        description: 'Another test book for admin management',
        price: 0,
        is_free: true,
        category: 'Non-Fiction',
        tags: ['test', 'non-fiction'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cover_image_url: null,
        content_url: null,
        isbn: null,
        publisher: null,
        published_date: null,
        page_count: 150,
        language: 'en',
        rating: 4.0,
        rating_count: 5
      }
    ]

    return NextResponse.json({
      success: true,
      books: mockBooks,
      total: mockBooks.length,
      limit: 50,
      offset: 0,
      message: 'Admin books test endpoint working'
    })
  } catch (error) {
    console.error('Admin books test endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Admin books test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}