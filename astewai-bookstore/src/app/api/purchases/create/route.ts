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

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { itemType, itemId } = body

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields: itemType, itemId' },
        { status: 400 }
      )
    }

    if (itemType !== 'book' && itemType !== 'bundle') {
      return NextResponse.json(
        { error: 'Invalid item type. Must be "book" or "bundle"' },
        { status: 400 }
      )
    }

    // Initiate purchase using the service
    const result = await purchaseService.initiatePurchase({
      userId: user.id,
      itemType,
      itemId,
      userEmail: user.email || '',
      userName: profile?.display_name || 'User'
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Purchase initiated successfully',
      ...result.data
    })

  } catch (error) {
    console.error('Error in create purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}