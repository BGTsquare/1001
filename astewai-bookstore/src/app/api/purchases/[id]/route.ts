import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentRepository } from '@/lib/repositories/payment-repository'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const { id } = await paramsconst supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const purchaseId = id

    // Get purchase details
    const result = await paymentRepository.getPurchaseById(purchaseId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch purchase' },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Check if user owns this purchase or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isOwner = result.data.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Purchase retrieved successfully',
      purchase: result.data
    })

  } catch (error) {
    console.error('Error in get purchase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}