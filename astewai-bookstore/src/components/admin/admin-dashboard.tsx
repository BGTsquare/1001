'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react'
import { AdminNavigation } from './admin-navigation'
import { BookManager } from './book-manager'
import { BookApproval } from './book-approval'
import { BundleManager } from './bundle-manager'
import { AdminContactManager } from '../contact/admin-contact-manager'
import { PurchaseRequestManager } from '../contact/purchase-request-manager'
import { ContactPurchaseManager } from './contact-purchase-manager'
import { MediaManager } from './media-manager'
import { UserManager } from './user-manager'
import { AnalyticsDashboard } from './analytics-dashboard'
import { PaymentApprovalDashboard } from './payment-approval-dashboard'

interface DashboardStats {
  totalBooks: number
  totalBundles: number
  totalUsers: number
  pendingPurchases: number
  totalRevenue: number
  newUsersThisMonth: number
}

interface AdminDashboardProps {
  stats?: DashboardStats
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const [selectedSection, setSelectedSection] = useState<string>('overview')

  // Default stats if none provided
  const defaultStats: DashboardStats = {
    totalBooks: 0,
    totalBundles: 0,
    totalUsers: 0,
    pendingPurchases: 0,
    totalRevenue: 0,
    newUsersThisMonth: 0,
    ...stats
  }

  const statCards = [
    {
      title: 'Total Books',
      value: defaultStats.totalBooks,
      description: 'Books in catalog',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      title: 'Total Bundles',
      value: defaultStats.totalBundles,
      description: 'Active bundles',
      icon: Package,
      color: 'text-green-600'
    },
    {
      title: 'Total Users',
      value: defaultStats.totalUsers,
      description: 'Registered users',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Pending Purchases',
      value: defaultStats.pendingPurchases,
      description: 'Awaiting approval',
      icon: ShoppingCart,
      color: 'text-orange-600'
    },
    {
      title: 'Total Revenue',
      value: `$${defaultStats.totalRevenue.toFixed(2)}`,
      description: 'All time revenue',
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'New Users',
      value: defaultStats.newUsersThisMonth,
      description: 'This month',
      icon: BarChart3,
      color: 'text-indigo-600'
    }
  ]

  const quickActions = [
    {
      title: 'Add New Book',
      description: 'Upload and publish a new book',
      icon: BookOpen,
      action: () => setSelectedSection('books'),
      variant: 'default' as const
    },
    {
      title: 'Create Bundle',
      description: 'Create a new book bundle',
      icon: Package,
      action: () => setSelectedSection('bundles'),
      variant: 'outline' as const
    },
    {
      title: 'Review Purchases',
      description: 'Approve pending purchase requests',
      icon: ShoppingCart,
      action: () => setSelectedSection('purchases'),
      variant: 'outline' as const,
      badge: defaultStats.pendingPurchases > 0 ? defaultStats.pendingPurchases : undefined
    },
    {
      title: 'Payment Approvals',
      description: 'Bulk approve payment requests',
      icon: ShoppingCart,
      action: () => setSelectedSection('payments'),
      variant: 'outline' as const,
      badge: defaultStats.pendingPurchases > 0 ? defaultStats.pendingPurchases : undefined
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      action: () => setSelectedSection('users'),
      variant: 'outline' as const
    }
  ]

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <AdminNavigation
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        pendingPurchases={defaultStats.pendingPurchases}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedSection === 'overview' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your digital bookstore from here
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {statCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-md bg-primary/10`}>
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{action.title}</h3>
                            {action.badge && (
                              <Badge variant="destructive" className="text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <Button
                          variant={action.variant}
                          size="sm"
                          onClick={action.action}
                        >
                          Go
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Activity tracking will be implemented in future updates</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Books Management Section */}
        {selectedSection === 'books' && (
          <div>
            <BookManager />
          </div>
        )}

        {/* Book Approval Section */}
        {selectedSection === 'approval' && (
          <div>
            <BookApproval />
          </div>
        )}

        {/* Bundle Management Section */}
        {selectedSection === 'bundles' && (
          <div>
            <BundleManager />
          </div>
        )}

        {/* Contact Management Section */}
        {selectedSection === 'contact' && (
          <div>
            <ContactPurchaseManager />
          </div>
        )}

        {/* Media Management Section */}
        {selectedSection === 'media' && (
          <div>
            <MediaManager />
          </div>
        )}

        {/* User Management Section */}
        {selectedSection === 'users' && (
          <div>
            <UserManager />
          </div>
        )}

        {/* Purchase Request Management Section */}
        {selectedSection === 'purchases' && (
          <div>
            <PurchaseRequestManager />
          </div>
        )}

        {/* Payment Approval Section */}
        {selectedSection === 'payments' && (
          <div>
            <PaymentApprovalDashboard />
          </div>
        )}

        {/* Analytics Dashboard Section */}
        {selectedSection === 'analytics' && (
          <div>
            <AnalyticsDashboard />
          </div>
        )}

        {/* Placeholder content for other sections */}
        {!['overview', 'books', 'approval', 'bundles', 'contact', 'media', 'purchases', 'users', 'analytics'].includes(selectedSection) && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 capitalize">{selectedSection}</h2>
              <p className="text-muted-foreground">
                This section will be implemented in future tasks
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}