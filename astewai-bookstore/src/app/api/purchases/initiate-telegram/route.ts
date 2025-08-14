import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { purchaseService } from '@/lib/services/purchase-service'

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
    const { itemType, itemId, amount } = body

    // Delegate to service layer
    const result = await purchaseService.initiateTelegramPurchase({
      userId: user.id,
      itemType,
      itemId,
      amount: parseFloat(amount)
    })

    if (!result.success) {
      // Determine appropriate status code based on error
      const statusCode = result.error?.includes('not found') ? 404 :
                        result.error?.includes('Invalid') ? 400 : 500
      
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error in initiate Telegram purchase API:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}