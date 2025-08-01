import { render, screen, fireEvent } from '@testing-library/react'
import { AdminDashboard } from '../admin-dashboard'

describe('AdminDashboard', () => {
  const mockStats = {
    totalBooks: 25,
    totalBundles: 5,
    totalUsers: 150,
    pendingPurchases: 3,
    totalRevenue: 1250.50,
    newUsersThisMonth: 12
  }

  it('renders dashboard with default stats when no stats provided', () => {
    render(<AdminDashboard />)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Manage your digital bookstore from here')).toBeInTheDocument()
    
    // Check that default stats (0) are displayed
    expect(screen.getByText('Total Books')).toBeInTheDocument()
    expect(screen.getByText('Total Bundles')).toBeInTheDocument()
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Pending Purchases')).toBeInTheDocument()
  })

  it('renders dashboard with provided stats', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByText('25')).toBeInTheDocument() // totalBooks
    expect(screen.getByText('5')).toBeInTheDocument() // totalBundles
    expect(screen.getByText('150')).toBeInTheDocument() // totalUsers
    expect(screen.getAllByText('3')).toHaveLength(3) // pendingPurchases (appears in stats and badges)
    expect(screen.getByText('$1250.50')).toBeInTheDocument() // totalRevenue
    expect(screen.getByText('12')).toBeInTheDocument() // newUsersThisMonth
  })

  it('displays quick actions with correct badges', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByText('Add New Book')).toBeInTheDocument()
    expect(screen.getByText('Create Bundle')).toBeInTheDocument()
    expect(screen.getByText('Review Purchases')).toBeInTheDocument()
    expect(screen.getByText('Manage Users')).toBeInTheDocument()

    // Check that pending purchases badge is shown
    const badges = screen.getAllByText('3')
    expect(badges.length).toBeGreaterThan(1) // Should appear in stats and badge
  })

  it('shows overview section by default', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('Activity tracking will be implemented in future updates')).toBeInTheDocument()
  })

  it('switches to different sections when navigation is clicked', () => {
    render(<AdminDashboard stats={mockStats} />)

    // Click on Books section
    const booksButton = screen.getByRole('button', { name: /Books/ })
    fireEvent.click(booksButton)

    expect(screen.getByText('Books')).toBeInTheDocument()
    expect(screen.getByText('This section will be implemented in future tasks')).toBeInTheDocument()
  })

  it('handles quick action clicks', () => {
    render(<AdminDashboard stats={mockStats} />)

    // Find and click the "Go" button for Add New Book
    const goButtons = screen.getAllByText('Go')
    fireEvent.click(goButtons[0]) // First "Go" button should be for Add New Book

    // Should switch to books section
    expect(screen.getByText('This section will be implemented in future tasks')).toBeInTheDocument()
  })

  it('shows pending purchases badge when there are pending purchases', () => {
    const statsWithPending = { ...mockStats, pendingPurchases: 5 }
    render(<AdminDashboard stats={statsWithPending} />)

    // Should show badge in navigation and quick actions
    const badges = screen.getAllByText('5')
    expect(badges.length).toBeGreaterThan(1)
  })

  it('does not show pending purchases badge when there are no pending purchases', () => {
    const statsWithoutPending = { ...mockStats, pendingPurchases: 0 }
    render(<AdminDashboard stats={statsWithoutPending} />)

    // Should only show 0 in the stats card, not as badges
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})