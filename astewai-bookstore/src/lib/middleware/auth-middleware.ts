/**
 * Authentication and Authorization Middleware
 * Provides reusable auth checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AuthResult {
  success: boolean
  user?: any
  profile?: any
  error?: string
  response?: NextResponse
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Error in requireAuth:', error)
    return {
      success: false,
      error: 'Authentication check failed',
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Check if user is authenticated and has admin role
 */
export async function requireAdmin(): Promise<AuthResult> {
  try {
    const authResult = await requireAuth()
    
    if (!authResult.success) {
      return authResult
    }

    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authResult.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return {
        success: false,
        error: 'Failed to verify user permissions',
        response: NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

    if (!profile || profile.role !== 'admin') {
      return {
        success: false,
        error: 'Admin access required',
        response: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
    }

    return { 
      success: true, 
      user: authResult.user, 
      profile 
    }
  } catch (error) {
    console.error('Error in requireAdmin:', error)
    return {
      success: false,
      error: 'Authorization check failed',
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Higher-order function to wrap API handlers with auth checks
 */
export function withAuth(handler: (request: NextRequest, context: any, authResult: AuthResult) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const authResult = await requireAuth()
    
    if (!authResult.success) {
      return authResult.response!
    }

    return handler(request, context, authResult)
  }
}

/**
 * Higher-order function to wrap API handlers with admin auth checks
 */
export function withAdminAuth(handler: (request: NextRequest, context: any, authResult: AuthResult) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const authResult = await requireAdmin()
    
    if (!authResult.success) {
      return authResult.response!
    }

    return handler(request, context, authResult)
  }
}