import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { AuthProvider, useAuth } from '../auth-context'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Test component to access auth context
function TestComponent() {
  const { user, profile, loading, signIn, signUp, signOut, resetPassword } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="profile">{profile ? profile.display_name : 'null'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password', 'Test User')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
      <button onClick={() => resetPassword('test@example.com')}>Reset Password</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('provides auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(screen.getByTestId('profile')).toHaveTextContent('null')
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('initializes with session data', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockProfile = { id: '123', display_name: 'Test User', role: 'user' }
    
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })
    
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        })),
      })),
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
  })

  it('handles signIn successfully', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signInButton = screen.getByText('Sign In')
    signInButton.click()
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
    })
  })

  it('handles signIn error', async () => {
    const errorMessage = 'Invalid credentials'
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: errorMessage },
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signInButton = screen.getByText('Sign In')
    signInButton.click()
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled()
    })
  })

  it('handles signUp successfully', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signUpButton = screen.getByText('Sign Up')
    signUpButton.click()
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: {
            display_name: 'Test User',
          },
        },
      })
    })
  })

  it('handles signOut', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signOutButton = screen.getByText('Sign Out')
    signOutButton.click()
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })
  })

  it('handles resetPassword', async () => {
    mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    })
    
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const resetButton = screen.getByText('Reset Password')
    resetButton.click()
    
    await waitFor(() => {
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        }
      )
    })
  })

  it('listens for auth state changes', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()
  })

  it('cleans up subscription on unmount', () => {
    const unsubscribeMock = vi.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    })
    
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    unmount()
    
    expect(unsubscribeMock).toHaveBeenCalled()
  })
})