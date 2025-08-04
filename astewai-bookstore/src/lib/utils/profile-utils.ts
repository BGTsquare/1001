import type { User } from '@supabase/supabase-js'
import type { ReadingPreferences } from '@/types'

// Constants for profile creation
export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  fontSize: 'medium',
  theme: 'light',
  fontFamily: 'sans-serif',
} as const

export const POSTGRES_ERROR_CODES = {
  NOT_FOUND: 'PGRST116',
} as const

/**
 * Generates a display name from user metadata or email
 */
export const generateDisplayName = (user: User | null): string => {
  return user?.user_metadata?.display_name || 
         user?.email?.split('@')[0] || 
         'User'
}

/**
 * Creates profile data object with default values
 */
export const createProfileData = (userId: string, displayName: string) => ({
  id: userId,
  display_name: displayName,
  role: 'user' as const,
  reading_preferences: DEFAULT_READING_PREFERENCES,
})