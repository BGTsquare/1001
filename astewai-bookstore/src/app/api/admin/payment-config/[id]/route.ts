import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentConfigService } from '@/lib/services/payment-config-service'

export async function PUT(
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

    const body = await request.json()
    const { provider_name, account_number, account_name, instructions, is_active, display_order } = body

    // Update payment configuration
    const paymentConfigService = new PaymentConfigService()
    const result = await paymentConfigService.updatePaymentConfig(id, {
      provider_name,
      account_number,
      account_name,
      instructions,
      is_active,
      display_order
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update payment configuration' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Payment configuration updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/payment-config/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete payment configuration
    const paymentConfigService = new PaymentConfigService()
    const result = await paymentConfigService.deletePaymentConfig(id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete payment configuration' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment configuration deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/payment-config/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}