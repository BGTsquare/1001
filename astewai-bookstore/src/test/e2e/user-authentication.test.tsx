import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ProtectedRoute } from '@/components/auth/protected-route'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

// Mock the auth context and services
const mockAuthService = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}

const mockAuthContext = {
  user: null,
  profile: null,
  loading: false,
  signIn: mockAuthService.signIn,
  signUp: mockAuthService.signUp,
  signOut: mockAuthService.signOut,
}

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthContext,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Test data factories
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone: null,
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

const createMockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'user-1',
  display_name: 'Test User',
  role: 'user',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Test helpers
const fillRegistrationForm = async (formData: {
  email: string
  password: string
  confirmPassword: string
  displayName: string
}) => {
  const emailInput = screen.getByLabelText(/email/i)
  const passwordInput = screen.getByLabelText(/password/i)
  const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
  const displayNameInput = screen.getByLabelText(/display name/i)

  fireEvent.change(emailInput, { target: { value: formData.email } })
  fireEvent.change(passwordInput, { target: { value: formData.password } })
  fireEvent.change(confirmPasswordInput, { target: { value: formData.confirmPassword } })
  fireEvent.change(displayNameInput, { target: { value: formData.displayName } })

  return { emailInput, passwordInput, confirmPasswordInput, displayNameInput }
}

const fillLoginForm = async (email: string, password: string) => {
  const emailInput = screen.getByLabelText(/email/i)
  const passwordInput = screen.getByLabelText(/password/i)

  fireEvent.change(emailInput, { target: { value: email } })
  fireEvent.change(passwordInput, { target: { value: password } })

  return { emailInput, passwordInput }
}

const setupMockRouter = () => {
  const mockPush = vi.fn()
  const mockReplace = vi.fn()
  vi.mocked(require('next/navigation').useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
  })
  return { mockPush, mockReplace }
}

const setAuthState = (user: User | null, profile: Profile | null, loading = false) => {
  mockAuthContext.user = user
  mockAuthContext.profile = profile
  mockAuthContext.loading = loading
}

describe('User Authentication E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.profile = null
    mockAuthContext.loading = false
  })

  describe('User Registration Flow', () => {
    it('completes full registration process', async () => {
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()
      const formData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        displayName: 'Test User',
      }

      // Mock successful registration
      mockAuthService.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<RegisterForm />)

      // Fill out registration form
      await fillRegistrationForm(formData)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      // Verify registration was called with correct data
      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith(
          formData.email,
          formData.password,
          { display_name: formData.displayName }
        )
      })

      // Verify success state
      expect(screen.getByText(/account created successfully/i)).toBeInTheDocument()
    })

    it('handles registration validation errors', async () => {
      render(<RegisterForm />)

      // Try to submit with invalid data
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
        expect(screen.getByText(/password must be at least/i)).toBeInTheDocument()
      })

      expect(mockAuthService.signUp).not.toHaveBeenCalled()
    })

    it('handles registration server errors', async () => {
      const formData = {
        email: 'existing@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        displayName: 'Test User',
      }

      mockAuthService.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      })

      render(<RegisterForm />)

      // Fill out form with valid data
      await fillRegistrationForm(formData)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Login Flow', () => {
    it('completes full login process', async () => {
      const mockUser = createMockUser()
      const credentials = { email: 'test@example.com', password: 'TestPassword123!' }

      mockAuthService.signIn.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<LoginForm />)

      // Fill out login form
      await fillLoginForm(credentials.email, credentials.password)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      // Verify login was called
      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith(
          credentials.email,
          credentials.password
        )
      })
    })

    it('handles invalid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'wrongpassword' }

      mockAuthService.signIn.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      })

      render(<LoginForm />)

      await fillLoginForm(credentials.email, credentials.password)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('shows loading state during login', async () => {
      const credentials = { email: 'test@example.com', password: 'TestPassword123!' }

      mockAuthService.signIn.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<LoginForm />)

      await fillLoginForm(credentials.email, credentials.password)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      // Verify loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Protected Route Access', () => {
    it('redirects unauthenticated users to login', () => {
      const { mockPush } = setupMockRouter()
      setAuthState(null, null)

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login')
      )
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('allows authenticated users to access protected content', () => {
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()
      setAuthState(mockUser, mockProfile)

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('shows loading state while checking authentication', () => {
      setAuthState(null, null, true)

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Session Management', () => {
    it('handles session expiration', async () => {
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()
      
      // Start with authenticated user
      setAuthState(mockUser, mockProfile)

      const { rerender } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()

      // Simulate session expiration
      setAuthState(null, null)
      setupMockRouter() // Reset router mock

      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('persists authentication across page reloads', () => {
      const mockUser = createMockUser()
      const mockProfile = createMockProfile()
      
      // Simulate page reload with stored session
      setAuthState(mockUser, mockProfile, false)

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  describe('Role-Based Access', () => {
    it('allows admin users to access admin routes', () => {
      const mockUser = createMockUser({ id: 'admin-1', email: 'admin@example.com' })
      const mockProfile = createMockProfile({ id: 'admin-1', role: 'admin' })
      setAuthState(mockUser, mockProfile)

      render(
        <ProtectedRoute requireRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('denies regular users access to admin routes', () => {
      const mockUser = createMockUser()
      const mockProfile = createMockProfile({ role: 'user' })
      const { mockPush } = setupMockRouter()
      setAuthState(mockUser, mockProfile)

      render(
        <ProtectedRoute requireRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})