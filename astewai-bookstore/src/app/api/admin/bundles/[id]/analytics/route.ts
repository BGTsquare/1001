import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bundleService } from '@/lib/services/bundle-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const { id } = await paramsconst supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get bundle value calculation
    const valueResult = await bundleService.calculateBundleValue(id)
    if (!valueResult.success) {
      return NextResponse.json({ error: valueResult.error }, { status: 404 })
    }

    // Get purchase statistics
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('item_type', 'bundle')
      .eq('item_id', id)

    if (purchaseError) {
      console.error('Error fetching purchase data:', purchaseError)
      return NextResponse.json({ error: 'Failed to fetch purchase data' }, { status: 500 })
    }

    // Get purchase requests statistics
    const { data: purchaseRequests, error: requestError } = await supabase
      .from('purchase_requests')
      .select('*')
      .eq('item_type', 'bundle')
      .eq('item_id', id)

    if (requestError) {
      console.error('Error fetching purchase request data:', requestError)
      return NextResponse.json({ error: 'Failed to fetch purchase request data' }, { status: 500 })
    }

    // Calculate analytics
    const totalPurchases = purchases.length
    const totalRevenue = purchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingRequests = purchaseRequests.filter(pr => pr.status === 'pending').length
    const approvedRequests = purchaseRequests.filter(pr => pr.status === 'approved').length
    const rejectedRequests = purchaseRequests.filter(pr => pr.status === 'rejected').length

    // Calculate conversion rate
    const totalRequests = purchaseRequests.length
    const conversionRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentPurchases = purchases.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo
    ).length

    const recentRequests = purchaseRequests.filter(pr => 
      new Date(pr.created_at) >= thirtyDaysAgo
    ).length

    const analytics = {
      ...valueResult.data,
      purchases: {
        total: totalPurchases,
        revenue: totalRevenue,
        recent: recentPurchases
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
        recent: recentRequests,
        conversionRate: Math.round(conversionRate * 100) / 100
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching bundle analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}