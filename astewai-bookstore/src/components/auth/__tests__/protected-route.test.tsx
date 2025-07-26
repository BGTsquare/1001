import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { ProtectedRoute } from '../protected-route'

// Mock the router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the auth context
let mockAuthState = {
  user: null,
  profile: null,
  loading: false,
}

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthState,
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: null,
      profile: null,
      loading: false,
    }
  })

  it('shows loading state when auth is loading', () => {
    mockAuthState.loading = true
    
    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows custom fallback when auth is loading', () => {
    mockAuthState.loading = true
    
    render(
      <ProtectedRoute fallback={<div>Custom loading...</div>}>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    expect(screen.getByText('Custom loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    mockAuthState.loading = false
    mockAuthState.user = null
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/protected-page',
        search: '?param=value',
      },
      writable: true,
    })
    
    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    expect(mockPush).toHaveBeenCalledWith(
      '/auth/login?redirectTo=%2Fprotected-page%3Fparam%3Dvalue'
    )
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to custom redirect path when specified', () => {
    mockAuthState.loading = false
    mockAuthState.user = null
    
    render(
      <ProtectedRoute redirectTo="/custom-login">
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/custom-login')
    )
  })

  it('renders children when user is authenticated', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    
    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when user becomes authenticated', () => {
    // Start with loading state
    mockAuthState.loading = true
    
    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    // User becomes authenticated
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    
    rerender(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})