'use client'

import { ReactNode } from 'react'
import { AdminGuard } from '@/components/auth/role-guard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/utils/constants'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showBackButton?: boolean
}

export function AdminLayout({ 
  children, 
  title = 'Admin Dashboard',
  description,
  showBackButton = true
}: AdminLayoutProps) {
  return (
    <AdminGuard
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You need administrator privileges to access this page.
            </p>
            <Link href={ROUTES.HOME}>
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      }
      showFallback={true}
    >
      <div className="min-h-screen bg-background">
        {/* Admin Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {showBackButton && (
                  <Link href={ROUTES.HOME}>
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Site
                    </Button>
                  </Link>
                )}
                <div>
                  <h1 className="text-xl font-semibold">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-sm text-muted-foreground">
                  Admin Mode
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Content */}
        <div className="container mx-auto p-0">
          {children}
        </div>
      </div>
    </AdminGuard>
  )
}