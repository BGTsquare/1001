'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AdminContactManager } from '../contact/admin-contact-manager';
import { PurchaseRequestManager } from '../contact/purchase-request-manager';
import { 
  MessageCircle, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Loader2
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import type { PurchaseRequest, AdminContactInfo } from '@/types';

interface PurchaseAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  totalRevenue: number;
  averageResponseTime: number;
  conversionRate: number;
  recentRequests: PurchaseRequest[];
  requestsByDay: { date: string; count: number }[];
  requestsByContactMethod: { method: string; count: number }[];
}

export function ContactPurchaseManager() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch purchase analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['purchase-analytics', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics/purchases?range=${selectedTimeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase analytics');
      }
      const result = await response.json();
      return result.data as PurchaseAnalytics;
    }
  });

  // Fetch admin contacts for overview
  const { data: contacts = [] } = useQuery({
    queryKey: ['admin-contact-info'],
    queryFn: async () => {
      const response = await fetch('/api/admin/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch contact information');
      }
      const result = await response.json();
      return result.data as AdminContactInfo[];
    }
  });

  const activeContacts = contacts?.filter(c => c.is_active) || [];
  const primaryContacts = contacts?.filter(c => c.is_primary) || [];

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contact & Purchase Management</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contact Methods</TabsTrigger>
          <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Contact Methods Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Contact Methods</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{contacts.length}</div>
                  <p className="text-sm text-muted-foreground">Total Methods</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{activeContacts.length}</div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{primaryContacts.length}</div>
                  <p className="text-sm text-muted-foreground">Primary</p>
                </div>
              </div>
              
              {contacts.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No contact methods configured</p>
                  <p className="text-sm text-muted-foreground">Add contact methods to receive purchase requests</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Requests Overview */}
          {analyticsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading analytics...</span>
              </CardContent>
            </Card>
          ) : analytics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    {getTimeRangeLabel(selectedTimeRange)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.pendingRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    Need attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Approved/Total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    From completed requests
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Recent Activity */}
          {analytics?.recentRequests && analytics.recentRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Purchase Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {request.book?.title || request.bundle?.title || 'Unknown Item'}
                          </span>
                          <Badge variant="outline">
                            {request.item_type === 'book' ? 'Book' : 'Bundle'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${request.amount} • {format(new Date(request.created_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contact Methods Tab */}
        <TabsContent value="contacts">
          <AdminContactManager />
        </TabsContent>

        {/* Purchase Requests Tab */}
        <TabsContent value="requests">
          <PurchaseRequestManager />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Purchase Analytics</h2>
            <div className="flex space-x-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {getTimeRangeLabel(range)}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading detailed analytics...</span>
              </CardContent>
            </Card>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{analytics.pendingRequests}</div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analytics.approvedRequests}</div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.completedRequests}</div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analytics.rejectedRequests}</div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analytics.totalRequests}</div>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Method Preferences */}
              {analytics.requestsByContactMethod.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preferred Contact Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.requestsByContactMethod.map((item) => (
                        <div key={item.method} className="flex items-center justify-between">
                          <span className="capitalize">{item.method || 'No preference'}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(item.count / analytics.totalRequests) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.averageResponseTime > 0 
                        ? `${Math.round(analytics.averageResponseTime)} hours`
                        : 'N/A'
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average time to first response
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requests approved and completed
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No analytics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getStatusBadge(status: PurchaseRequest['status']) {
  const variants = {
    pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
    contacted: { variant: 'default' as const, icon: MessageCircle, label: 'Contacted' },
    approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
    rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
    completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}