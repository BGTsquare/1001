import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const range = url.searchParams.get('range') || '30d';

    // Calculate date range
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Fetch purchase requests within the date range
    const { data: requests, error: requestsError } = await supabase
      .from('purchase_requests')
      .select(`
        *,
        book:books(id, title, author),
        bundle:bundles(id, title)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (requestsError) {
      throw new Error('Failed to fetch purchase requests');
    }

    const allRequests = requests || [];

    // Calculate analytics
    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'pending').length;
    const approvedRequests = allRequests.filter(r => r.status === 'approved').length;
    const rejectedRequests = allRequests.filter(r => r.status === 'rejected').length;
    const completedRequests = allRequests.filter(r => r.status === 'completed').length;
    const contactedRequests = allRequests.filter(r => r.status === 'contacted').length;

    // Calculate total revenue from completed requests
    const totalRevenue = allRequests
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);

    // Calculate conversion rate (approved + completed / total)
    const conversionRate = totalRequests > 0 
      ? ((approvedRequests + completedRequests) / totalRequests) * 100 
      : 0;

    // Calculate average response time (time from created to contacted/responded)
    const respondedRequests = allRequests.filter(r => r.contacted_at || r.responded_at);
    const averageResponseTime = respondedRequests.length > 0
      ? respondedRequests.reduce((sum, r) => {
          const createdAt = new Date(r.created_at);
          const respondedAt = new Date(r.contacted_at || r.responded_at || r.created_at);
          const diffHours = (respondedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return sum + diffHours;
        }, 0) / respondedRequests.length
      : 0;

    // Group requests by day
    const requestsByDay = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayRequests = allRequests.filter(r => {
        const requestDate = new Date(r.created_at);
        return requestDate >= dayStart && requestDate <= dayEnd;
      });

      requestsByDay.push({
        date: format(date, 'MMM d'),
        count: dayRequests.length
      });
    }

    // Group requests by contact method preference
    const contactMethodCounts: { [key: string]: number } = {};
    allRequests.forEach(r => {
      const method = r.preferred_contact_method || 'none';
      contactMethodCounts[method] = (contactMethodCounts[method] || 0) + 1;
    });

    const requestsByContactMethod = Object.entries(contactMethodCounts)
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);

    // Get recent requests (last 10)
    const recentRequests = allRequests.slice(0, 10);

    const analytics = {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      completedRequests,
      contactedRequests,
      totalRevenue,
      averageResponseTime,
      conversionRate,
      recentRequests,
      requestsByDay,
      requestsByContactMethod
    };

    return NextResponse.json({ data: analytics });
  } catch (error) {
    console.error('Error fetching purchase analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase analytics' },
      { status: 500 }
    );
  }
}