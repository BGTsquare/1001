import { createClient } from '@/lib/supabase/server'

export interface AdminStats {
  totalBooks: number
  totalBundles: number
  totalUsers: number
  pendingPurchases: number
  totalRevenue: number
  newUsersThisMonth: number
}

export class AdminStatsService {
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const supabase = await createClient()
      
      // Get total books count
      const { count: totalBooks } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })

      // Get total bundles count
      const { count: totalBundles } = await supabase
        .from('bundles')
        .select('*', { count: 'exact', head: true })

      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get pending purchase requests count
      const { count: pendingPurchases } = await supabase
        .from('purchase_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get total revenue from completed purchases
      const { data: revenueData } = await supabase
        .from('purchases')
        .select('amount')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, purchase) => sum + purchase.amount, 0) || 0

      // Get new users this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      return {
        totalBooks: totalBooks || 0,
        totalBundles: totalBundles || 0,
        totalUsers: totalUsers || 0,
        pendingPurchases: pendingPurchases || 0,
        totalRevenue,
        newUsersThisMonth: newUsersThisMonth || 0
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      // Return default stats on error
      return {
        totalBooks: 0,
        totalBundles: 0,
        totalUsers: 0,
        pendingPurchases: 0,
        totalRevenue: 0,
        newUsersThisMonth: 0
      }
    }
  }

  async getRecentActivity(limit: number = 10) {
    try {
      const supabase = await createClient()
      
      // Get recent purchases
      const { data: recentPurchases } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          status,
          item_type,
          created_at,
          profiles!inner(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Get recent user registrations
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      return {
        recentPurchases: recentPurchases || [],
        recentUsers: recentUsers || []
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return {
        recentPurchases: [],
        recentUsers: []
      }
    }
  }
}