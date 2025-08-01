import { render, screen } from '@testing-library/react'
import { AdminLayout } from '../admin-layout'
import { useAuth } from '@/contexts/auth-context'
// import { ROUTES } from '@/utils/constants'
import { vi } from 'vitest'

// Mock the auth context
vi.mock('@/contexts/auth-context')
const mockUseAuth = useAuth as any

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('AdminLayout', () => {
  const mockChildren = <div data-testid="admin-content">Admin Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders admin content for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@test.com' } as any,
      profile: { id: '1', role: 'admin', display_name: 'Admin User' } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    })

    render(
      <AdminLayout title="Test Admin">
        {mockChildren}
      </AdminLayout>
    )

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    expect(screen.getByText('Test Admin')).toBeInTheDocument()
    expect(screen.getByText('Admin Mode')).toBeInTheDocument()
    expect(screen.getByText('Back to Site')).toBeInTheDocument()
  })

  it('shows access denied for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'user@test.com' } as any,
      profile: { id: '1', role: 'user', display_name: 'Regular User' } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    })

    render(
      <AdminLayout>
        {mockChildren}
      </AdminLayout>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You need administrator privileges to access this page.')).toBeInTheDocument()
    expect(screen.getByText('Return Home')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

  it('shows access denied when user has no profile', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'user@test.com' } as any,
      profile: null, // Profile not loaded yet
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    })

    render(
      <AdminLayout>
        {mockChildren}
      </AdminLayout>
    )

    // Should show access denied when profile is not available
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

  it('shows nothing for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    })

    render(
      <AdminLayout>
        {mockChildren}
      </AdminLayout>
    )

    // The RoleGuard returns null for unauthenticated users (ProtectedRoute should handle this)
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
    expect(document.body.textContent).toBe('')
  })

  it('renders custom title and description', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@test.com' } as any,
      profile: { id: '1', role: 'admin', display_name: 'Admin User' } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    })

    render(
      <AdminLayout 
        title="Custom Admin Title" 
        description="Custom description"
        showBackButton={false}
      >
        {mockChildren}
      </AdminLayout>
    )

    expect(screen.getByText('Custom Admin Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
    expect(screen.queryByText('Back to Site')).not.toBeInTheDocument()
  })
})