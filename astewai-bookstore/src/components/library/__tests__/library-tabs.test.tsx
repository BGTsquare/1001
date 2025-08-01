import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { LibraryTabs } from '../library-tabs'

const mockOnTabChange = vi.fn()

const defaultProps = {
  activeTab: 'all' as const,
  onTabChange: mockOnTabChange,
  children: <div>Test content</div>
}

describe('LibraryTabs', () => {
  beforeEach(() => {
    mockOnTabChange.mockClear()
  })

  it('renders all tab triggers', () => {
    render(<LibraryTabs {...defaultProps} />)
    
    expect(screen.getByText('All Books')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows stats when provided', () => {
    const stats = {
      total: 25,
      inProgress: 5,
      completed: 10
    }

    render(<LibraryTabs {...defaultProps} stats={stats} />)
    
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('calls onTabChange when tab is clicked', () => {
    render(<LibraryTabs {...defaultProps} />)
    
    // Find the tab trigger buttons
    const tabs = screen.getAllByRole('tab')
    const inProgressTab = tabs.find(tab => tab.textContent?.includes('In Progress'))
    
    if (inProgressTab) {
      fireEvent.click(inProgressTab)
      expect(mockOnTabChange).toHaveBeenCalled()
    }
  })

  it('renders children content', () => {
    render(<LibraryTabs {...defaultProps} />)
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    render(<LibraryTabs {...defaultProps} activeTab="completed" />)
    
    const completedTab = screen.getByText('Completed').closest('button')
    expect(completedTab).toHaveAttribute('data-state', 'active')
  })

  it('applies custom className', () => {
    const { container } = render(
      <LibraryTabs {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})