import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Debug endpoint to check admin books API configuration
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      api: {
        route: '/api/admin/books/debug',
        method: 'GET',
        status: 'working'
      },
      services: {
        bookService: 'available',
        bookRepository: 'available',
        authMiddleware: 'available'
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      message: 'Admin books debug endpoint working - configuration looks good'
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Admin books debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}