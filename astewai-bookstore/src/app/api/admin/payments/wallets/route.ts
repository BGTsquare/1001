import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_request: NextRequest) {
  try {
    // authenticate as admin via session user and profile check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // verify profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const prof: any = profile

    if (!prof || prof.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: wallets, error } = await (supabaseAdmin as any)
      .from('wallet_config')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: wallets })
  } catch (error) {
    console.error('Error in GET /api/admin/payments/wallets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const prof: any = profile

    if (!prof || prof.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, deep_link_template, account_details, wallet_name, is_active } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const updatePayload: any = {}
    if (deep_link_template !== undefined) updatePayload.deep_link_template = deep_link_template
    if (account_details !== undefined) updatePayload.account_details = account_details
    if (wallet_name !== undefined) updatePayload.wallet_name = wallet_name
    if (is_active !== undefined) updatePayload.is_active = is_active

    const { data: updated, error } = await (supabaseAdmin as any)
      .from('wallet_config')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error in PUT /api/admin/payments/wallets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const prof: any = profile
    if (!prof || prof.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { wallet_name, wallet_type, deep_link_template, account_details, instructions, is_active, display_order, icon_url } = body

    if (!wallet_name || !wallet_type) return NextResponse.json({ error: 'wallet_name and wallet_type are required' }, { status: 400 })

    const insertPayload: any = {
      wallet_name,
      wallet_type,
      deep_link_template: deep_link_template ?? null,
      account_details: account_details ?? null,
      instructions: instructions ?? null,
      is_active: is_active ?? true,
      display_order: display_order ?? 0,
      icon_url: icon_url ?? null
    }

    const { data: created, error } = await (supabaseAdmin as any)
      .from('wallet_config')
      .insert(insertPayload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/payments/wallets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const prof: any = profile
    if (!prof || prof.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data: deleted, error } = await (supabaseAdmin as any)
      .from('wallet_config')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: deleted })
  } catch (error) {
    console.error('Error in DELETE /api/admin/payments/wallets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
