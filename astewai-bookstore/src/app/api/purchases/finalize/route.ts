import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const { purchaseId, status } = body

    if (!purchaseId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: purchaseId, status' },
        { status: 400 }
      )
    }

    if (status !== 'completed' && status !== 'rejected') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "completed" or "rejected"' },
        { status: 400 }
      )
    }

    // Finalize purchase using the service
    const result = await purchaseService.finalizePurchase(purchaseId, status)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        purchase: result.data.purchase,
        user: {
          email: result.data.user.email,
          name: result.data.user.name
        },
        item: {
          title: result.data.item.title,
          type: result.data.item.type
        }
      }
    })

  } catch (error) {
    console.error('Error in finalize purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}