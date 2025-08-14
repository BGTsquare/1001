import { NextRequest, NextResponse } from 'next/server'
import { purchaseService } from '@/lib/services/purchase-service'

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
    const { purchaseId, telegramData } = body

    if (!purchaseId || !telegramData) {
      return NextResponse.json(
        { error: 'Missing required fields: purchaseId, telegramData' },
        { status: 400 }
      )
    }

    // Update purchase with Telegram user data
    const result = await purchaseService.updateTelegramUserData(purchaseId, telegramData)

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
    console.error('Error in update Telegram data API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}