import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    console.log('Storage test endpoint called')
    const supabase = await createClient()
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    // Test profile fetch
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile fetch failed',
        details: profileError.message
      }, { status: 500 })
    }

    // Test storage bucket listing with admin client
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    if (bucketsError) {
      return NextResponse.json({ 
        error: 'Storage listing failed',
        details: bucketsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        role: profile.role
      },
      storage: {
        buckets: buckets.map(b => ({ id: b.id, name: b.name, public: b.public }))
      }
    })

  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request) // Same logic for POST
}