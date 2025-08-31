import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    const { purchaseId } = await request.json()

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 })
    }

    // Get purchase details before rejection for Telegram notification
    const { data: purchase } = await supabase
      .from('purchases')
      .select('telegram_chat_id, transaction_reference, item_type')
      .eq('id', purchaseId)
      .single()

    // Use the database function to reject the purchase
    const { data: result, error } = await supabase
      .rpc('reject_purchase', { purchase_id_param: purchaseId })

    if (error) {
      console.error('Error rejecting purchase:', error)
      return NextResponse.json(
        { error: 'Failed to reject purchase' },
        { status: 500 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Purchase not found or already processed' },
        { status: 404 }
      )
    }

    // Note: User will be notified via email or in-app notification

    return NextResponse.json({ 
      success: true, 
      message: 'Purchase rejected successfully' 
    })

  } catch (error) {
    console.error('Error in reject purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

