'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  BookOpen,
  Package,
  Users,
  ShoppingCart,
  FileText,
  BarChart3,
  CheckCircle,
  Database
} from 'lucide-react'

interface AdminNavigationProps {
  selectedSection: string
  onSectionChange: (section: string) => void
  pendingPurchases?: number
}

export function AdminNavigation({
  selectedSection,
  onSectionChange,
  pendingPurchases = 0
}: AdminNavigationProps) {
  const contentItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Dashboard overview' },
    { id: 'books', label: 'Books', icon: BookOpen, description: 'Manage book catalog' },
    { id: 'approval', label: 'Approval', icon: CheckCircle, description: 'Review pending books' },
    { id: 'bundles', label: 'Bundles', icon: Package, description: 'Manage book bundles' },
    { id: 'blog', label: 'Blog', icon: FileText, description: 'Blog management' }
  ]

  const paymentItems = [
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart, description: 'Purchase requests', badge: pendingPurchases > 0 ? pendingPurchases : undefined },
    { id: 'payments', label: 'Payment Approvals', icon: ShoppingCart, description: 'Approve payments', badge: pendingPurchases > 0 ? pendingPurchases : undefined },
  { id: 'wallets', label: 'Wallet Configurations', icon: Database, description: '' }
  ]

  const adminItems = [
    { id: 'users', label: 'Users', icon: Users, description: 'User management' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Performance metrics' }
  ]

  return (
    <div className="w-64 border-r bg-muted/10 p-4">
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Admin</h2>
        </div>

        <div>
          <h3 className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">Content</h3>
          <div className="space-y-1 px-2">
            {contentItems.map((item) => {
              const Icon = item.icon
              const isSelected = selectedSection === item.id
              return (
                <Button key={item.id} variant={isSelected ? 'secondary' : 'ghost'} className={cn('w-full justify-start h-auto p-3', isSelected && 'bg-secondary')} onClick={() => onSectionChange(item.id)}>
                  <div className="flex items-center space-x-3 w-full">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">Payments</h3>
          <div className="space-y-1 px-2">
            {paymentItems.map((item) => {
              const Icon = item.icon
              const isSelected = selectedSection === item.id
              return (
                <Button key={item.id} variant={isSelected ? 'secondary' : 'ghost'} className={cn('w-full justify-start h-auto p-3', isSelected && 'bg-secondary')} onClick={() => onSectionChange(item.id)}>
                  <div className="flex items-center space-x-3 w-full">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.badge && <Badge variant="destructive" className="text-xs ml-2">{item.badge}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">Administration</h3>
          <div className="space-y-1 px-2">
            {adminItems.map((item) => {
              const Icon = item.icon
              const isSelected = selectedSection === item.id
              return (
                <Button key={item.id} variant={isSelected ? 'secondary' : 'ghost'} className={cn('w-full justify-start h-auto p-3', isSelected && 'bg-secondary')} onClick={() => onSectionChange(item.id)}>
                  <div className="flex items-center space-x-3 w-full">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}