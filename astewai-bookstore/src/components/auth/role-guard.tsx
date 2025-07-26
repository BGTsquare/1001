'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
  fallback?: React.ReactNode
  showFallback?: boolean
}

export function RoleGuard({ 
  children, 
  allowedRoles,
  redirectTo = '/',
  fallback,
  showFallback = false
}: RoleGuardProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const hasRequiredRole = profile && allowedRoles.includes(profile.role)

  useEffect(() => {
    if (!loading && user && profile && !hasRequiredRole && !showFallback) {
      router.push(redirectTo)
    }
  }, [user, profile, loading, hasRequiredRole, router, redirectTo, showFallback])

  // Show loading state while checking authentication and profile
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Loading"></div>
        </div>
      )
    )
  }

  // If user is not authenticated, don't render anything (ProtectedRoute should handle this)
  if (!user) {
    return null
  }

  // If profile is not loaded yet, show loading
  if (!profile) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Loading"></div>
        </div>
      )
    )
  }

  // If user doesn't have required role
  if (!hasRequiredRole) {
    if (showFallback) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        )
      )
    }
    return null
  }

  return <>{children}</>
}

// Higher-order component version for easier use
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[],
  options?: {
    redirectTo?: string
    fallback?: React.ReactNode
    showFallback?: boolean
  }
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard 
        allowedRoles={allowedRoles}
        redirectTo={options?.redirectTo}
        fallback={options?.fallback}
        showFallback={options?.showFallback}
      >
        <Component {...props} />
      </RoleGuard>
    )
  }
}

// Convenience components for common roles
export function AdminGuard({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} {...props}>
      {children}
    </RoleGuard>
  )
}

export function UserGuard({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['user', 'admin']} {...props}>
      {children}
    </RoleGuard>
  )
}