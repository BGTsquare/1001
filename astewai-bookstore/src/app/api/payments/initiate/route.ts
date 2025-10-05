import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/services/payment-service'
import type { CreatePaymentRequestData } from '@/lib/types/payment'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { item_type, item_id, amount, currency, selected_wallet_id } = body

    // Validate required fields
    if (!item_type || !item_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: item_type, item_id, amount' },
        { status: 400 }
      )
    }

    if (item_type !== 'book' && item_type !== 'bundle') {
      return NextResponse.json(
        { error: 'Invalid item_type. Must be "book" or "bundle"' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      )
    }

    // Initiate payment
    const result = await paymentService.initiatePayment(user.id, {
      item_type,
      item_id,
      amount,
      currency: currency || 'ETB',
      selected_wallet_id
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error in payment initiation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


