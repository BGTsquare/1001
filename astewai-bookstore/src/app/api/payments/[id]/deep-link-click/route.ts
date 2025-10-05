import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/services/payment-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const paymentRequestId = params.id

    if (!paymentRequestId) {
      return NextResponse.json(
        { error: 'Payment request ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns this payment request
    const paymentResult = await paymentService.getPaymentRequest(paymentRequestId)
    if (!paymentResult.success || !paymentResult.data) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    if (paymentResult.data.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment request' },
        { status: 403 }
      )
    }

    // Record deep link click
    const result = await paymentService.recordDeepLinkClick(paymentRequestId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Deep link click recorded successfully'
    })

  } catch (error) {
    console.error('Error in deep link click API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


