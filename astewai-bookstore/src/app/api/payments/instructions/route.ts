import { NextResponse } from 'next/server'
import { paymentConfigService } from '@/lib/services/payment-config-service'

export async function GET() {
  try {
    const result = await paymentConfigService.getActivePaymentMethods()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch payment instructions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error in GET /api/payments/instructions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}