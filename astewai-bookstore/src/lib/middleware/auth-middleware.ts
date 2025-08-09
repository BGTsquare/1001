import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export interface AuthenticatedRequest extends NextRequest {
  user: User
  profile: {
    id: string
    role: string
    display_name?: string
    avatar_url?: string
  }
}

export interface AuthMiddlewareOptions {
  requireProfile?: boolean
  allowedRoles?: string[]
}

/**
 * Enhanced authentication middleware with better error handling and performance
 */
export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = { requireProfile: true }
) {
  return async (request: NextRequest) => {
    try {
      const supabase = await createClient()
      
      // Get user with better error handling
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError.message)
        return NextResponse.json(
          { error: 'Authentication failed', details: authError.message }, 
          { status: 401 }
        )
      }
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      let profile = null
      
      // Only fetch profile if required (performance optimization)
      if (options.requireProfile) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, display_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError.message)
          return NextResponse.json(
            { error: 'Profile not found', details: profileError.message }, 
            { status: 404 }
          )
        }

        profile = profileData
        
        // Check role-based access if specified
        if (options.allowedRoles && !options.allowedRoles.includes(profile.role)) {
          return NextResponse.json(
            { error: `Forbidden - Required roles: ${options.allowedRoles.join(', ')}` }, 
            { status: 403 }
          )
        }
      }

      // Extend request object with auth data
      const authenticatedRequest = Object.assign(request, {
        user,
        profile
      }) as AuthenticatedRequest

      return handler(authenticatedRequest)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Admin-only authentication middleware
 */
export async function withAdminAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requireProfile: true, allowedRoles: ['admin'] })
}

/**
 * User authentication middleware (no profile required for better performance)
 */
export async function withUserAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requireProfile: false })
}

/**
 * Role-based authentication middleware
 */
export function withRoleAuth(
  roles: string[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requireProfile: true, allowedRoles: roles })
}