import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { RoleGuard, AdminGuard, UserGuard } from '../role-guard'

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

describe('RoleGuard', () => {
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
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('shows custom fallback when auth is loading', () => {
    mockAuthState.loading = true
    
    render(
      <RoleGuard allowedRoles={['admin']} fallback={<div>Custom loading...</div>}>
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(screen.getByText('Custom loading...')).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('returns null when user is not authenticated', () => {
    mockAuthState.loading = false
    mockAuthState.user = null
    
    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows loading when user is authenticated but profile is not loaded', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    mockAuthState.profile = null
    
    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('redirects when user does not have required role', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    mockAuthState.profile = { id: '123', role: 'user' } as any
    
    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(mockPush).toHaveBeenCalledWith('/')
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('redirects to custom path when specified', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    mockAuthState.profile = { id: '123', role: 'user' } as any
    
    render(
      <RoleGuard allowedRoles={['admin']} redirectTo="/unauthorized">
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(mockPush).toHaveBeenCalledWith('/unauthorized')
  })

  it('shows fallback when showFallback is true and user lacks role', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    mockAuthState.profile = { id: '123', role: 'user' } as any
    
    render(
      <RoleGuard allowedRoles={['admin']} showFallback={true}>
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText(/you don't have permission/i)).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows custom fallback when showFallback is true', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    mockAuthState.profile = { id: '123', role: 'user' } as any
    
    render(
      <RoleGuard 
        allowedRoles={['admin']} 
        showFallback={true}
        fallback={<div>Custom access denied</div>}
      >
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(screen.getByText('Custom access denied')).toBeInTheDocument()
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })

  it('renders children when user has required role', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    mockAuthState.profile = { id: '123', role: 'admin' } as any
    
    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin content</div>
      </RoleGuard>
    )
    
    expect(screen.getByText('Admin content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders children when user has one of multiple allowed roles', () => {
    mockAuthState.loading = false
    mockAuthState.user = { id: '123', email: 'test@example.com' } as any
    mockAuthState.profile = { id: '123', role: 'user' } as any
    
    render(
      <RoleGuard allowedRoles={['admin', 'user']}>
        <div>User content</div>
      </RoleGuard>
    )
    
    expect(screen.getByText('User content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: { id: '123', email: 'test@example.com' } as any,
      profile: null,
      loading: false,
    }
  })

  it('allows access for admin users', () => {
    mockAuthState.profile = { id: '123', role: 'admin' } as any
    
    render(
      <AdminGuard>
        <div>Admin content</div>
      </AdminGuard>
    )
    
    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })

  it('denies access for non-admin users', () => {
    mockAuthState.profile = { id: '123', role: 'user' } as any
    
    render(
      <AdminGuard>
        <div>Admin content</div>
      </AdminGuard>
    )
    
    expect(mockPush).toHaveBeenCalledWith('/')
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
  })
})

describe('UserGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: { id: '123', email: 'test@example.com' } as any,
      profile: null,
      loading: false,
    }
  })

  it('allows access for regular users', () => {
    mockAuthState.profile = { id: '123', role: 'user' } as any
    
    render(
      <UserGuard>
        <div>User content</div>
      </UserGuard>
    )
    
    expect(screen.getByText('User content')).toBeInTheDocument()
  })

  it('allows access for admin users', () => {
    mockAuthState.profile = { id: '123', role: 'admin' } as any
    
    render(
      <UserGuard>
        <div>User content</div>
      </UserGuard>
    )
    
    expect(screen.getByText('User content')).toBeInTheDocument()
  })
})