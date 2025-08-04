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

export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const supabase = createClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, display_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user
      authenticatedRequest.profile = profile

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

export async function withAdminAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    if (request.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    return handler(request)
  })
}