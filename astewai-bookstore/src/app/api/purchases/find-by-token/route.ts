import { NextRequest, NextResponse } from 'next/server'
import { purchaseService } from '@/lib/services/purchase-service'

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

    const { searchParams } = new URL(request.url)
    const initiationToken = searchParams.get('token')

    if (!initiationToken) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      )
    }

    // Find purchase by token
    const result = await purchaseService.findPurchaseByToken(initiationToken)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    // Transform to the format expected by the bot
    const purchase = result.data
    const transformedPurchase = {
      purchase_id: purchase.id,
      user_id: purchase.user_id,
      user_email: 'Unknown', // This would come from user lookup
      user_name: 'Unknown',   // This would come from user lookup
      item_type: purchase.item_type,
      item_id: purchase.item_id,
      item_title: purchase.item?.title || 'Unknown Item',
      amount: purchase.amount,
      status: purchase.status,
      transaction_reference: purchase.transaction_reference,
      created_at: purchase.created_at
    }

    return NextResponse.json({
      success: true,
      data: transformedPurchase
    })

  } catch (error) {
    console.error('Error in find purchase by token API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}