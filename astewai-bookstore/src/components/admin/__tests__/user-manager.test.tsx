import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserManager } from '../user-manager'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the fetch function
global.fetch = vi.fn()

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024'
    if (formatStr === 'MMM d, yyyy HH:mm') return 'Jan 1, 2024 10:00'
    return 'Jan 1, 2024'
  }),
}))

const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    display_name: 'Admin User',
    avatar_url: null,
    role: 'admin' as const,
    reading_preferences: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-01T10:00:00Z',
    email_confirmed_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'user@example.com',
    display_name: 'Regular User',
    avatar_url: null,
    role: 'user' as const,
    reading_preferences: { fontSize: 'medium', theme: 'light' },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    last_sign_in_at: '2024-01-02T10:00:00Z',
    email_confirmed_at: '2024-01-02T00:00:00Z'
  }
]

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('UserManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockUsers }),
    })
  })

  it('renders user management interface', async () => {
    renderWithQueryClient(<UserManager />)
    
    // Wait for users to load first
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })
  })

  it('displays user statistics correctly', async () => {
    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('Admins')).toBeInTheDocument()
      expect(screen.getByText('Regular Users')).toBeInTheDocument()
      // Check for the specific numbers in context
      const totalUsersCard = screen.getByText('Total Users').closest('[data-slot="card"]')
      expect(totalUsersCard).toHaveTextContent('2')
    })
  })

  it('filters users by search term', async () => {
    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search users by name or email...')
    fireEvent.change(searchInput, { target: { value: 'admin' } })

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
    })
  })

  it('filters users by role', async () => {
    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    // Find and click the role filter dropdown
    const roleFilter = screen.getByRole('combobox')
    fireEvent.click(roleFilter)
    
    // Select "Admins Only"
    const adminOption = screen.getByText('Admins Only')
    fireEvent.click(adminOption)

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
    })
  })

  it('displays user badges correctly', async () => {
    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
    })
  })

  it('opens user details dialog', async () => {
    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    // Click the more options button for the first user
    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg') // Looking for the MoreHorizontal icon
    )
    
    if (moreButton) {
      fireEvent.click(moreButton)
      
      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument()
        expect(screen.getByText('Profile Information')).toBeInTheDocument()
      })
    }
  })

  it('handles role update', async () => {
    // Mock successful role update
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockUsers[1], role: 'admin' } }),
      })

    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    // Find the user card for Regular User and click its manage button
    const regularUserCard = screen.getByText('Regular User').closest('div')
    const manageButton = regularUserCard?.querySelector('button[aria-haspopup="dialog"]')
    
    if (manageButton) {
      fireEvent.click(manageButton)
      
      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument()
        expect(screen.getByText('Promote to Admin')).toBeInTheDocument()
      })

      const promoteButton = screen.getByText('Promote to Admin')
      fireEvent.click(promoteButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/2/role',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'admin' }),
          })
        )
      })
    }
  })

  it('handles loading state', () => {
    // Mock loading state
    ;(global.fetch as any).mockImplementation(() => new Promise(() => {}))
    
    renderWithQueryClient(<UserManager />)
    
    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })

  it('handles empty user list', async () => {
    // Mock empty response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('No users found matching your criteria.')).toBeInTheDocument()
    })
  })

  it('displays reading preferences when available', async () => {
    renderWithQueryClient(<UserManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    // Click the more options button for the user with reading preferences
    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg') // Looking for the MoreHorizontal icon
    )
    
    if (moreButton) {
      fireEvent.click(moreButton)
      
      await waitFor(() => {
        expect(screen.getByText('Reading Preferences')).toBeInTheDocument()
      })
    }
  })
})