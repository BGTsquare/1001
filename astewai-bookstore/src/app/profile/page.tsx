import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfilePageClient } from './profile-page-client'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // If profile doesn't exist, create one
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        role: 'user',
        reading_preferences: {
          fontSize: 'medium',
          theme: 'light',
          fontFamily: 'sans-serif',
        },
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      redirect('/auth/login')
    }

    return <ProfilePageClient profile={newProfile} user={user} />
  }

  return <ProfilePageClient profile={profile} user={user} />
}

export const metadata = {
  title: 'Profile - Astewai Digital Bookstore',
  description: 'Manage your profile and reading preferences',
}