import { NextRequest, NextResponse } from 'next/server'
import { PaymentConfigService } from '@/lib/services/payment-config-service'

export async function GET(request: NextRequest) {
  try {
    // Verify bot authentication
    const authHeader = request.headers.get('authorization')
    const botSecret = process.env.TELEGRAM_BOT_SECRET

    if (!authHeader || !botSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (token !== botSecret) {
      return NextResponse.json(
        { error: 'Invalid bot token' },
        { status: 401 }
      )
    }

    // Get payment configuration
    const paymentConfigService = new PaymentConfigService()
    const result = await paymentConfigService.getActivePaymentMethods()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || []
    })

  } catch (error) {
    console.error('Error in payment config API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}