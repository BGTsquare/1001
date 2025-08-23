import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { purchaseService } from '@/lib/services/purchase-service'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const purchaseId = id

    // Get optional rejection reason from request body
    const body = await request.json().catch(() => ({}))
    const { reason } = body

    // Reject the purchase
    const result = await purchaseService.rejectManualPurchase(purchaseId, reason)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reject purchase' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Purchase rejected successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/purchases/[id]/reject:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}