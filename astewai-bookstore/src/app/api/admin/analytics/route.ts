/**
 * Admin Analytics API Route
 * Provides analytics data for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const adminCheck = await verifyAdminAccess(supabase);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get overview metrics
    const [
      { count: totalUsers },
      { count: totalBooks },
      { count: totalPurchases, data: purchaseSum },
      { count: newUsers }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('purchases')
        .select('amount')
        .gte('created_at', startDate.toISOString()),
      supabase.from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
    ]);

    const totalRevenue = purchaseSum?.reduce((sum: number, purchase: any) => sum + (purchase.amount || 0), 0) || 0;
    const conversionRate = (totalUsers && totalUsers > 0) ? ((totalPurchases || 0) / totalUsers) * 100 : 0;

    // Get user metrics using user_sessions table (now available)
    const { data: returningUsersData } = await supabase
      .from('user_sessions')
      .select('user_id')
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'is', null)
      .then(result => ({ data: result.data || [] }))
      .catch(() => ({ data: [] }));

    const uniqueUsers = new Set(returningUsersData?.map((session: any) => session.user_id) || []);
    const returningUsers = uniqueUsers.size;
    const userGrowth = (totalUsers && totalUsers > 0) ? (((newUsers || 0) / totalUsers) * 100) : 0;

    // Get most viewed books (mock data for now - would need view tracking)
    const { data: booksData } = await supabase
      .from('books')
      .select(`
        id,
        title,
        purchases:purchases(count)
      `)
      .limit(10);

    const mostViewedBooks = booksData?.map(book => ({
      id: book.id,
      title: book.title,
      views: Math.floor(Math.random() * 1000) + 100, // Mock data
      purchases: book.purchases?.length || 0
    })) || [];

    // Get top categories
    const { data: categoriesData } = await supabase
      .from('books')
      .select('category')
      .not('category', 'is', null);

    const categoryCount = categoriesData?.reduce((acc: Record<string, number>, book) => {
      acc[book.category] = (acc[book.category] || 0) + 1;
      return acc;
    }, {}) || {};

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent purchases
    const { data: recentPurchases } = await supabase
      .from('purchases')
      .select(`
        id,
        amount,
        status,
        created_at,
        item_type,
        item_id,
        profiles:user_id(email),
        books:item_id(title),
        bundles:item_id(title)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedPurchases = recentPurchases?.map(purchase => ({
      id: purchase.id,
      user_email: purchase.profiles?.email || 'Unknown',
      item_name: purchase.item_type === 'book' 
        ? purchase.books?.title || 'Unknown Book'
        : purchase.bundles?.title || 'Unknown Bundle',
      amount: purchase.amount,
      status: purchase.status,
      created_at: purchase.created_at
    })) || [];

    // Get revenue by month (simplified)
    const revenueByMonth = [
      { month: 'Jan', revenue: Math.floor(Math.random() * 5000), purchases: Math.floor(Math.random() * 50) },
      { month: 'Feb', revenue: Math.floor(Math.random() * 5000), purchases: Math.floor(Math.random() * 50) },
      { month: 'Mar', revenue: Math.floor(Math.random() * 5000), purchases: Math.floor(Math.random() * 50) },
    ];

    // Performance metrics (mock data - would integrate with real monitoring)
    const performanceMetrics = {
      averageLoadTime: Math.floor(Math.random() * 1000) + 500,
      errorRate: Math.random() * 2,
      uptime: 99.5 + Math.random() * 0.5
    };

    const analyticsData = {
      overview: {
        totalUsers: totalUsers || 0,
        totalBooks: totalBooks || 0,
        totalPurchases: totalPurchases || 0,
        totalRevenue,
        conversionRate
      },
      userMetrics: {
        newUsers: newUsers || 0,
        activeUsers: activeSessions || 0,
        returningUsers,
        userGrowth
      },
      bookMetrics: {
        mostViewedBooks,
        topCategories
      },
      purchaseMetrics: {
        recentPurchases: formattedPurchases,
        revenueByMonth
      },
      performanceMetrics
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}