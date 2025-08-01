import { render, screen, fireEvent } from '@testing-library/react'
import { AdminNavigation } from '../admin-navigation'
import { vi } from 'vitest'

describe('AdminNavigation', () => {
  const mockOnSectionChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all navigation items', () => {
    render(
      <AdminNavigation 
        selectedSection="overview" 
        onSectionChange={mockOnSectionChange}
      />
    )

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Books')).toBeInTheDocument()
    expect(screen.getByText('Bundles')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Purchases')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights the selected section', () => {
    render(
      <AdminNavigation 
        selectedSection="books" 
        onSectionChange={mockOnSectionChange}
      />
    )

    const booksButton = screen.getByRole('button', { name: /Books/ })
    expect(booksButton).toHaveClass('bg-secondary')
  })

  it('calls onSectionChange when navigation item is clicked', () => {
    render(
      <AdminNavigation 
        selectedSection="overview" 
        onSectionChange={mockOnSectionChange}
      />
    )

    const booksButton = screen.getByRole('button', { name: /Books/ })
    fireEvent.click(booksButton)

    expect(mockOnSectionChange).toHaveBeenCalledWith('books')
  })

  it('shows pending purchases badge when provided', () => {
    render(
      <AdminNavigation 
        selectedSection="overview" 
        onSectionChange={mockOnSectionChange}
        pendingPurchases={5}
      />
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not show pending purchases badge when count is 0', () => {
    render(
      <AdminNavigation 
        selectedSection="overview" 
        onSectionChange={mockOnSectionChange}
        pendingPurchases={0}
      />
    )

    // Should not have any badges
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows descriptions for each navigation item', () => {
    render(
      <AdminNavigation 
        selectedSection="overview" 
        onSectionChange={mockOnSectionChange}
      />
    )

    expect(screen.getByText('Dashboard overview')).toBeInTheDocument()
    expect(screen.getByText('Manage book catalog')).toBeInTheDocument()
    expect(screen.getByText('Manage book bundles')).toBeInTheDocument()
    expect(screen.getByText('User management')).toBeInTheDocument()
    expect(screen.getByText('Purchase requests')).toBeInTheDocument()
    expect(screen.getByText('Blog management')).toBeInTheDocument()
    expect(screen.getByText('Contact settings')).toBeInTheDocument()
    expect(screen.getByText('Performance metrics')).toBeInTheDocument()
    expect(screen.getByText('System settings')).toBeInTheDocument()
  })

  it('applies correct styling to selected and unselected items', () => {
    render(
      <AdminNavigation 
        selectedSection="users" 
        onSectionChange={mockOnSectionChange}
      />
    )

    const usersButton = screen.getByRole('button', { name: /Users/ })
    const booksButton = screen.getByRole('button', { name: /Books/ })

    expect(usersButton).toHaveClass('bg-secondary')
    expect(booksButton).not.toHaveClass('bg-secondary')
  })
})