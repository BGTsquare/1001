import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { purchaseService } from '@/lib/services/purchase-service'

export async function GET(request: NextRequest) {
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

    // Get user's purchase history
    const result = await purchaseService.getUserPurchaseHistory(user.id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch purchase history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Purchase history retrieved successfully',
      purchases: result.data || []
    })

  } catch (error) {
    console.error('Error in purchase history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}