'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { 
  POSTGRES_ERROR_CODES, 
  generateDisplayName, 
  createProfileData 
} from '@/lib/utils/profile-utils'

interface AuthResult {
  error?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Hook to access authentication context
 * @throws {Error} When used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, create a default one
        if (error.code === POSTGRES_ERROR_CODES.NOT_FOUND) {
          console.log('Profile not found, creating default profile for user:', userId)
          await createDefaultProfile(userId)
          return
        }
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const createDefaultProfile = async (userId: string): Promise<void> => {
    try {
      const { data: user } = await supabase.auth.getUser()
      const displayName = generateDisplayName(user.user)
      const profileData = createProfileData(userId, displayName)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating default profile:', error)
        return
      }

      setProfile(profile)
    } catch (error) {
      console.error('Error creating default profile:', error)
    }
  }

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      return { error: 'An unexpected error occurred during sign in' }
    }
  }

  const signUp = async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      // Create profile if user was created successfully
      if (data.user) {
        try {
          const profileData = createProfileData(data.user.id, displayName)
          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)

          if (profileError) {
            console.error('Error creating profile during signup:', profileError)
            // Don't return error here as auth was successful
          }
        } catch (profileError) {
          console.error('Error creating profile during signup:', profileError)
        }
      }

      return {}
    } catch (error) {
      console.error('Unexpected error during sign up:', error)
      return { error: 'An unexpected error occurred during sign up' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Unexpected error during password reset:', error)
      return { error: 'An unexpected error occurred during password reset' }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}