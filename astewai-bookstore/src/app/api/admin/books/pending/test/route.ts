import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple test endpoint to verify API routing works
    const mockBooks = [
      {
        id: '1',
        title: 'Test Book 1',
        author: 'Test Author 1',
        description: 'A test book for approval',
        price: 9.99,
        is_free: false,
        category: 'Fiction',
        tags: ['test', 'fiction'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewer_notes: null
      },
      {
        id: '2',
        title: 'Test Book 2',
        author: 'Test Author 2',
        description: 'Another test book for approval',
        price: 0,
        is_free: true,
        category: 'Non-Fiction',
        tags: ['test', 'non-fiction'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewer_notes: null
      }
    ]

    return NextResponse.json({
      success: true,
      books: mockBooks,
      total: mockBooks.length,
      message: 'Test endpoint working'
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}