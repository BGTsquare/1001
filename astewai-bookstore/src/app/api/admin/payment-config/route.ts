import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get payment configurations
    const { data: configs, error } = await supabase
      .from('payment_config')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch payment configs' }, { status: 500 })
    }

    return NextResponse.json({ data: configs })

  } catch (error) {
    console.error('Error fetching payment configs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { config_type, provider_name, account_number, account_name, instructions, is_active, display_order } = body

    if (!config_type || !provider_name || !account_number || !account_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('payment_config')
      .insert({
        config_type,
        provider_name,
        account_number,
        account_name,
        instructions,
        is_active: is_active ?? true,
        display_order: display_order ?? 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create payment config' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error creating payment config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing config ID' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('payment_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update payment config' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error updating payment config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}