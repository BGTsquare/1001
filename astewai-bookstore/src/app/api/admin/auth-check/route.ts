import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH CHECK API CALLED ===')
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('Auth error:', authError.message)
      return NextResponse.json({
        authenticated: false,
        error: authError.message,
        timestamp: new Date().toISOString()
      })
    }
    
    if (!user) {
      console.log('No user found')
      return NextResponse.json({
        authenticated: false,
        message: 'No user session found',
        timestamp: new Date().toISOString()
      })
    }
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single()
    
    console.log('User authenticated:', user.email, 'Role:', profile?.role)
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || 'unknown',
        display_name: profile?.display_name
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in auth check:', error)
    return NextResponse.json({
      authenticated: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}