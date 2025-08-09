import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Storage test endpoint called')
    
    // Basic test without auth to see if routing works
    return NextResponse.json({
      success: true,
      message: 'Storage test endpoint is working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    })
  } catch (error) {
    console.error('Storage test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Storage test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}