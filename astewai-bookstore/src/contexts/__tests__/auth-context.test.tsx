import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Mock profile utilities
vi.mock('@/lib/utils/profile-utils', () => ({
  POSTGRES_ERROR_CODES: { NOT_FOUND: 'PGRST116' },
  generateDisplayName: vi.fn((user) => user?.email?.split('@')[0] || 'User'),
  createProfileData: vi.fn((userId, displayName) => ({
    id: userId,
    display_name: displayName,
    role: 'user',
    reading_preferences: {
      fontSize: 'medium',
      theme: 'light',
      fontFamily: 'sans-serif',
    },
  })),
}))

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
}

// Test component that uses the auth context
function TestComponent() {
  const { user, profile, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (user) return <div>User: {user.email}</div>
  return <div>No user</div>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabase)
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  it('should provide auth context to children', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument()
    })
  })

  it('should handle profile creation when profile not found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockProfile = { id: 'user-123', display_name: 'test', role: 'user' }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } }
    })
    
    // First call fails with NOT_FOUND error
    mockSupabase.from().select().eq().single
      .mockRejectedValueOnce({ code: 'PGRST116' })
      .mockResolvedValueOnce({ data: mockProfile, error: null })

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
    mockSupabase.from().insert().select().single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })
  })
})