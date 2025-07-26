import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth(): Promise<User> {
  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }
  return user
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  
  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }
  
  return user
}

export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.role === 'admin' || false
}