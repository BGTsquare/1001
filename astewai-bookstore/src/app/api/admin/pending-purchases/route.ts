import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get pending purchases using the database function
    const { data: purchases, error } = await supabase
      .rpc('get_pending_purchases', { 
        limit_count: 50,
        offset_count: 0 
      })

    if (error) {
      console.error('Error fetching pending purchases:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending purchases' },
        { status: 500 }
      )
    }

    return NextResponse.json({ purchases: purchases || [] })

  } catch (error) {
    console.error('Error in pending purchases API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}