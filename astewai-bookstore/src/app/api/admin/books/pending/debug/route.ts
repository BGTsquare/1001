import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Debug endpoint to check environment and configuration
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
        route: '/api/admin/books/pending/debug',
        method: 'GET',
        status: 'working'
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      message: 'Debug endpoint working - environment looks good'
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}