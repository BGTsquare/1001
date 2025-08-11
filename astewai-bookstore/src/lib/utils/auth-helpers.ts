import { createClient } from '@/lib/supabase/server'

export interface AuthResult {
  success: boolean
  error?: string
  status: number
  user?: any
}

/**
 * Validate that the current user has admin access
 */
export async function validateAdminAccess(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
        status: 401
      }
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return {
        success: false,
        error: 'Failed to verify user permissions',
        status: 500
      }
    }

    if (!profile || profile.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden - Admin access required',
        status: 403
      }
    }

    return {
      success: true,
      status: 200,
      user
    }
  } catch (error) {
    console.error('Error in validateAdminAccess:', error)
    return {
      success: false,
      error: 'Internal server error during authentication',
      status: 500
    }
  }
}

/**
 * Validate that the current user is authenticated
 */
export async function validateUserAccess(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
        status: 401
      }
    }

    return {
      success: true,
      status: 200,
      user
    }
  } catch (error) {
    console.error('Error in validateUserAccess:', error)
    return {
      success: false,
      error: 'Internal server error during authentication',
      status: 500
    }
  }
}