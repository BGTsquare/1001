'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname + window.location.search
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [user, loading, router, redirectTo])

  // Show loading state while checking authentication
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Loading"></div>
        </div>
      )
    )
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null
  }

  return <>{children}</>
}

// Higher-order component version for easier use
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string
    fallback?: React.ReactNode
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        redirectTo={options?.redirectTo}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}