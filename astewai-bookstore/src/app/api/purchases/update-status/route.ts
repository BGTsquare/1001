import { NextRequest, NextResponse } from 'next/server'
import { paymentRepository } from '@/lib/repositories/payment-repository'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { purchaseId, status } = body

    if (!purchaseId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: purchaseId, status' },
        { status: 400 }
      )
    }

    // Update purchase status
    const result = await paymentRepository.updatePurchase(purchaseId, { status })

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
    console.error('Error in update status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}