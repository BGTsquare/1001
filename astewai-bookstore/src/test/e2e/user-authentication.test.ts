import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ProtectedRoute } from '@/components/auth/protected-route'

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

describe('User Authentication E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.profile = null
    mockAuthContext.loading = false
  })

  describe('User Registration Flow', () => {
    it('completes full registration process', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockProfile = { id: 'user-1', display_name: 'Test User', role: 'user' }

      // Mock successful registration
      mockAuthService.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<RegisterForm />)

      // Fill out registration form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const displayNameInput = screen.getByLabelText(/display name/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'TestPassword123!' } })
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      // Verify registration was called with correct data
      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith(
          'test@example.com',
          'TestPassword123!',
          { display_name: 'Test User' }
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
      mockAuthService.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      })

      render(<RegisterForm />)

      // Fill out form with valid data
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'TestPassword123!' } })

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
      const mockUser = { id: 'user-1', email: 'test@example.com' }

      mockAuthService.signIn.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      render(<LoginForm />)

      // Fill out login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      // Verify login was called
      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith(
          'test@example.com',
          'TestPassword123!'
        )
      })
    })

    it('handles invalid credentials', async () => {
      mockAuthService.signIn.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('shows loading state during login', async () => {
      mockAuthService.signIn.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } })

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      // Verify loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Protected Route Access', () => {
    it('redirects unauthenticated users to login', () => {
      const mockPush = vi.fn()
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
      })

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
      mockAuthContext.user = { id: 'user-1', email: 'test@example.com' }
      mockAuthContext.profile = { id: 'user-1', role: 'user' }

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('shows loading state while checking authentication', () => {
      mockAuthContext.loading = true

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
      // Start with authenticated user
      mockAuthContext.user = { id: 'user-1', email: 'test@example.com' }
      mockAuthContext.profile = { id: 'user-1', role: 'user' }

      const { rerender } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()

      // Simulate session expiration
      mockAuthContext.user = null
      mockAuthContext.profile = null

      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      // Should redirect to login
      const mockPush = vi.fn()
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
      })

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('persists authentication across page reloads', () => {
      // Simulate page reload with stored session
      mockAuthContext.user = { id: 'user-1', email: 'test@example.com' }
      mockAuthContext.profile = { id: 'user-1', role: 'user' }
      mockAuthContext.loading = false

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
      mockAuthContext.user = { id: 'admin-1', email: 'admin@example.com' }
      mockAuthContext.profile = { id: 'admin-1', role: 'admin' }

      render(
        <ProtectedRoute requireRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('denies regular users access to admin routes', () => {
      mockAuthContext.user = { id: 'user-1', email: 'user@example.com' }
      mockAuthContext.profile = { id: 'user-1', role: 'user' }

      const mockPush = vi.fn()
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
      })

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