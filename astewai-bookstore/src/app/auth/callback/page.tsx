import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  if (params.error) {
    // Handle auth error
    console.error('Auth callback error:', params.error, params.error_description)
    redirect(`/auth/login?error=${encodeURIComponent(params.error_description || params.error)}`)
  }

  if (params.code) {
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      redirect(`/auth/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
    }

    // Check if user has a profile
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // Create profile if it doesn't exist
      if (!profile) {
        const displayName = user.user_metadata?.display_name || 
                           user.user_metadata?.full_name || 
                           user.email?.split('@')[0] || 
                           'User'

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            display_name: displayName,
            role: 'user',
            reading_preferences: {
              fontSize: 'medium',
              theme: 'light',
              fontFamily: 'sans-serif',
            },
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Don't fail the auth flow for profile creation errors
        }
      }
    }

    // Successful authentication - redirect to home or intended page
    redirect('/')
  }

  // No code or error - redirect to login
  redirect('/auth/login')
}
