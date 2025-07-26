'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/types'

export async function updateProfile(
  userId: string,
  updates: {
    display_name?: string
    avatar_url?: string | null
    reading_preferences?: Record<string, any>
  }
): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error(error.message)
  }

  revalidatePath('/profile')
  return data as Profile
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function createProfile(
  userId: string,
  displayName: string
): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name: displayName,
      role: 'user',
      reading_preferences: {
        fontSize: 'medium',
        theme: 'light',
        fontFamily: 'sans-serif',
      },
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    throw new Error(error.message)
  }

  return data as Profile
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  const supabase = await createClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  try {
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      throw new Error(uploadError.message)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw new Error('Failed to upload avatar')
  }
}

export async function deleteAvatar(
  userId: string,
  avatarUrl: string
): Promise<void> {
  const supabase = await createClient()

  try {
    // Extract file path from URL
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(-2).join('/') // Get 'avatars/filename'

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (error) {
      console.error('Error deleting avatar:', error)
      // Don't throw error here as it's not critical
    }
  } catch (error) {
    console.error('Error deleting avatar:', error)
    // Don't throw error here as it's not critical
  }
}

