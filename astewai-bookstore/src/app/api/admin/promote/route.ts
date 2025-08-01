import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Promoting user to admin:', user.id, user.email)

    // Simply promote the current user to admin
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('Error promoting user:', error)
      return NextResponse.json(
        { error: `Failed to promote user to admin: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('No profile found for user:', user.id)
      return NextResponse.json(
        { error: 'Profile not found. Please make sure you have a complete profile.' },
        { status: 404 }
      )
    }

    console.log('Successfully promoted user:', data[0])

    return NextResponse.json({ 
      message: 'Successfully promoted to admin',
      user: data[0]
    })
  } catch (error) {
    console.error('Error in promote endpoint:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}