import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentRepository } from '@/lib/repositories/payment-repository'
import type { PaymentFilters, PaymentSortOptions, PaginationOptions } from '@/lib/types/payment'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin role
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    const filters: PaymentFilters = {}
    const sort: PaymentSortOptions = {
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc'
    }
    const pagination: PaginationOptions = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Parse filters
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[]
    }
    
    if (searchParams.get('wallet_type')) {
      filters.wallet_type = searchParams.get('wallet_type')!.split(',') as any[]
    }
    
    if (searchParams.get('date_from') && searchParams.get('date_to')) {
      filters.date_range = [
        new Date(searchParams.get('date_from')!),
        new Date(searchParams.get('date_to')!)
      ]
    }
    
    if (searchParams.get('amount_min') && searchParams.get('amount_max')) {
      filters.amount_range = [
        parseFloat(searchParams.get('amount_min')!),
        parseFloat(searchParams.get('amount_max')!)
      ]
    }
    
    if (searchParams.get('auto_matched')) {
      filters.auto_matched = searchParams.get('auto_matched') === 'true'
    }
    
    if (searchParams.get('search')) {
      filters.search_query = searchParams.get('search')!
    }

    // Get payment requests
    const result = await paymentRepository.getPaymentRequests(filters, sort, pagination)

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
    console.error('Error in admin payments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


