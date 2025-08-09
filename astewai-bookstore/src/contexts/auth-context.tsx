'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import {
  POSTGRES_ERROR_CODES,
  generateDisplayName,
  createProfileData
} from '@/lib/utils/profile-utils'
import { mapAuthError } from '@/lib/auth/constants'

/**
 * Result type for authentication operations
 */
interface AuthResult {
  error?: string
  success?: boolean
}

/**
 * Authentication context interface providing user state and auth methods
 */
interface AuthContextType {
  /** Current authenticated user from Supabase Auth */
  user: User | null
  /** User profile data from the profiles table */
  profile: Profile | null
  /** Loading state for initial auth check */
  loading: boolean
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<AuthResult>
  /** Sign up with email, password, and display name */
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>
  /** Sign out the current user */
  signOut: () => Promise<void>
  /** Send password reset email */
  resetPassword: (email: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const createDefaultProfile = useCallback(async (userId: string, user?: User | null): Promise<void> => {
    try {
      // Use the passed user object if available, otherwise fetch as a fallback.
      const userToProcess = user || (await supabase.auth.getUser()).data.user;

      if (!userToProcess) {
        console.error('Cannot create profile, user object not available.');
        return;
      }

      const displayName = generateDisplayName(userToProcess);
      const profileData = createProfileData(userId, displayName);

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert(profileData as any) // Type assertion needed due to Json type mismatch
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
        return;
      }

      setProfile(newProfile);
    } catch (error) {
      console.error('Unexpected error while creating default profile:', error);
    }
  }, [supabase]);

  const fetchProfile = useCallback(async (userId: string, user?: User | null): Promise<void> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === POSTGRES_ERROR_CODES.NOT_FOUND) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Profile not found, creating default profile for user:', userId);
          }
          await createDefaultProfile(userId, user); // Pass user to avoid re-fetch
          return;
        }
        console.error('Error fetching profile:', error.message || error);
        return;
      }

      setProfile(profile);
    } catch (error) {
      console.error('Unexpected error fetching profile:', error instanceof Error ? error.message : error);
    }
  }, [supabase, createDefaultProfile]);

  useEffect(() => {
    const handleAuthStateChange = async (session: { user: User } | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    // Get initial session and handle it
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleAuthStateChange(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchProfile]);


  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: mapAuthError(error.message) };
      return { success: true };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { error: 'An unexpected error occurred during sign in.' };
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) return { error: mapAuthError(error.message) };
      // Profile creation is handled by the onAuthStateChange listener.
      return { success: true };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return { error: 'An unexpected error occurred during sign up.' };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) return { error: mapAuthError(error.message) };
      return { success: true };
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      return { error: 'An unexpected error occurred during password reset.' };
    }
  }, [supabase]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [user, profile, loading, signIn, signUp, signOut, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}