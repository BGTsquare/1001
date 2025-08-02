'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Package,
  Calendar,
  Percent,
  BookOpen
} from 'lucide-react'
import type { Bundle } from '@/types'

interface BundleWithBooks extends Bundle {
  books: Array<{
    id: string
    title: string
    author: string
    price: number
  }>
}

interface BundleAnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundle: BundleWithBooks
}

interface BundleAnalytics {
  bundlePrice: number
  totalBookPrice: number
  savings: number
  discountPercentage: number
  purchases: {
    total: number
    revenue: number
    recent: number
  }
  requests: {
    total: number
    pending: number
    approved: number
    rejected: number
    recent: number
    conversionRate: number
  }
}

export function BundleAnalyticsDialog({ open, onOpenChange, bundle }: BundleAnalyticsDialogProps) {
  // Fetch bundle analytics
  const { data: analytics, isLoading, error } = useQuery<BundleAnalytics>({
    queryKey: ['bundle-analytics', bundle.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/bundles/${bundle.id}/analytics`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      return response.json()
    },
    enabled: open && !!bundle.id
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Bundle Analytics</span>
          </DialogTitle>
          <DialogDescription>
            Performance metrics and insights for &quot;{bundle.title}&quot;
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Failed to load analytics. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Bundle Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Bundle Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Bundle Title</div>
                    <div className="font-medium">{bundle.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Books Included</div>
                    <div className="font-medium">{bundle.books?.length || 0} books</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">
                      {new Date(bundle.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                    <div className="font-medium">
                      {new Date(bundle.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bundle Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(analytics.bundlePrice)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current selling price
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Individual Price</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(analytics.totalBookPrice)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total if bought separately
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customer Savings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(analytics.savings)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Value provided to customers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Discount</CardTitle>
                  <Percent className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(analytics.discountPercentage)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Discount percentage
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Purchase Performance</span>
                  </CardTitle>
                  <CardDescription>
                    Completed purchases and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Purchases</span>
                    <Badge variant="secondary">{analytics.purchases.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(analytics.purchases.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recent Purchases (30 days)</span>
                    <Badge variant="outline">{analytics.purchases.recent}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Purchase Requests</span>
                  </CardTitle>
                  <CardDescription>
                    Manual purchase request activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Requests</span>
                    <Badge variant="secondary">{analytics.requests.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <Badge variant="destructive">{analytics.requests.pending}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Approved</span>
                    <Badge variant="default">{analytics.requests.approved}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rejected</span>
                    <Badge variant="outline">{analytics.requests.rejected}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">
                      {formatPercentage(analytics.requests.conversionRate)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Recent Activity (30 days)</span>
                </CardTitle>
                <CardDescription>
                  Activity summary for the past month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recent Purchases</span>
                      <Badge variant="secondary">{analytics.purchases.recent}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Completed purchases in the last 30 days
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recent Requests</span>
                      <Badge variant="secondary">{analytics.requests.recent}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      New purchase requests in the last 30 days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bundle Books */}
            {bundle.books && bundle.books.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Included Books</span>
                  </CardTitle>
                  <CardDescription>
                    Books included in this bundle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bundle.books.map((book) => (
                      <div key={book.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-muted-foreground">by {book.author}</div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(book.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}