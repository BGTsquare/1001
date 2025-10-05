import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment-service'

export async function GET(request: NextRequest) {
  try {
    // This endpoint is public for wallet configuration
    const result = await paymentService.getActiveWallets()

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
    console.error('Error in wallets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


