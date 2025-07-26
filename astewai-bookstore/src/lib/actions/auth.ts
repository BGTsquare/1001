'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedData = loginSchema.parse(data)

  const { error } = await supabase.auth.signInWithPassword(validatedData)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    displayName: formData.get('displayName') as string,
  }

  const validatedData = registerSchema.parse(data)

  const { data: authData, error } = await supabase.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
    options: {
      data: {
        display_name: validatedData.displayName,
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  // Create profile if user was created successfully
  if (authData.user) {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          display_name: validatedData.displayName,
          role: 'user',
          reading_preferences: {
            fontSize: 'medium',
            theme: 'light',
            fontFamily: 'sans-serif',
          },
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Don't throw error here as auth was successful
      }
    } catch (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }

  redirect('/auth/login?message=Check your email to confirm your account')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  
  if (!email) {
    throw new Error('Email is required')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { message: 'Password reset email sent' }
}