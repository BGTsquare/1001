import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/services/payment-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const paymentRequestId = params.id
    const body = await request.json()
    const { verification_method, approve, notes } = body

    // Validate required fields
    if (!verification_method || !['manual', 'bank_statement', 'sms_verification'].includes(verification_method)) {
      return NextResponse.json(
        { error: 'Invalid verification method' },
        { status: 400 }
      )
    }

    if (typeof approve !== 'boolean') {
      return NextResponse.json(
        { error: 'Approve field must be a boolean' },
        { status: 400 }
      )
    }

    // Verify payment request exists
    const paymentResult = await paymentService.getPaymentRequest(paymentRequestId)
    if (!paymentResult.success || !paymentResult.data) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    // Admin verify payment
    const result = await paymentService.adminVerifyPayment(
      paymentRequestId,
      user.id,
      verification_method,
      approve,
      notes
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: approve ? 'Payment verified successfully' : 'Payment rejected'
    })

  } catch (error) {
    console.error('Error in admin verify payment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


