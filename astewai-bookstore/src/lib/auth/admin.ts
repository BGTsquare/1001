import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User as AuthUser } from '@supabase/supabase-js'
import type { Profile } from '@/types'

// Role constants for better maintainability
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export interface AdminAccessResult {
  /** Whether the user has admin privileges */
  isAdmin: boolean
  /** The authenticated user from Supabase Auth */
  user: AuthUser | null
  /** The user's profile from the database */
  profile: Profile | null
}

/**
 * Verifies if the current user has admin access
 * @param supabase Optional Supabase client instance
 * @returns Promise resolving to admin access result
 */
export async function verifyAdminAccess(supabase?: SupabaseClient): Promise<AdminAccessResult> {
  try {
    const client = supabase || await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await client.auth.getUser()
    
    if (userError) {
      console.warn('Auth error during admin verification:', userError.message)
      return {
        isAdmin: false,
        user: null,
        profile: null
      }
    }

    if (!user) {
      return {
        isAdmin: false,
        user: null,
        profile: null
      }
    }

    // Get the user's profile to check their role
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, role, display_name, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.warn('Profile fetch error during admin verification:', {
        userId: user.id,
        error: profileError.message
      })
      return {
        isAdmin: false,
        user,
        profile: null
      }
    }

    if (!profile) {
      console.warn('No profile found for user:', user.id)
      return {
        isAdmin: false,
        user,
        profile: null
      }
    }

    const isAdmin = profile.role === USER_ROLES.ADMIN

    return {
      isAdmin,
      user,
      profile
    }
  } catch (error) {
    // Log error with context for debugging
    console.error('Error verifying admin access:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    return {
      isAdmin: false,
      user: null,
      profile: null
    }
  }
}

/**
 * Requires admin access and throws a descriptive error if not authorized
 * @param supabase Optional Supabase client instance
 * @returns AdminAccessResult if user is admin
 * @throws Error with specific message if not authorized
 */
export async function requireAdminAccess(supabase?: SupabaseClient): Promise<AdminAccessResult> {
  const result = await verifyAdminAccess(supabase)
  
  if (!result.user) {
    throw new Error('Authentication required. Please log in to continue.')
  }
  
  if (!result.profile) {
    throw new Error('User profile not found. Please contact support.')
  }
  
  if (!result.isAdmin) {
    throw new Error('Admin privileges required. Access denied.')
  }
  
  return result
}

/**
 * Checks if a user has admin role without throwing errors
 * @param userId The user ID to check
 * @param supabase Optional Supabase client instance
 * @returns boolean indicating admin status
 */
export async function isUserAdmin(userId: string, supabase?: SupabaseClient): Promise<boolean> {
  try {
    const client = supabase || await createClient()
    
    const { data: profile, error } = await client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      return false
    }
    
    return profile.role === USER_ROLES.ADMIN
  } catch (error) {
    console.error('Error checking user admin status:', error)
    return false
  }
}

/**
 * Type guard to check if a profile has admin role
 * @param profile The profile to check
 * @returns boolean indicating if profile is admin
 */
export function isAdminProfile(profile: Profile | null): profile is Profile & { role: 'admin' } {
  return profile?.role === USER_ROLES.ADMIN
}