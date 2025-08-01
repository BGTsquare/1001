import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { LibraryFilters } from '../library-filters'

const mockOnSortChange = vi.fn()

const defaultProps = {
  sortBy: 'added_at' as const,
  sortOrder: 'desc' as const,
  onSortChange: mockOnSortChange
}

describe('LibraryFilters', () => {
  beforeEach(() => {
    mockOnSortChange.mockClear()
  })

  it('renders all sort options', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    expect(screen.getByText(/Date Added/)).toBeInTheDocument()
    expect(screen.getByText(/Last Read/)).toBeInTheDocument()
    expect(screen.getByText(/Title/)).toBeInTheDocument()
    expect(screen.getByText(/Progress/)).toBeInTheDocument()
  })

  it('highlights active sort option', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    const activeButton = screen.getByText(/Date Added/)
    expect(activeButton.closest('button')).toHaveClass('bg-primary')
  })

  it('shows sort direction indicator', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    expect(screen.getByText('Date Added ↓')).toBeInTheDocument()
  })

  it('calls onSortChange when sort option is clicked', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    const titleButton = screen.getByText(/Title/)
    fireEvent.click(titleButton)
    
    expect(mockOnSortChange).toHaveBeenCalledWith('title', 'asc')
  })

  it('toggles sort order when same option is clicked', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    const dateButton = screen.getByText(/Date Added/)
    fireEvent.click(dateButton)
    
    expect(mockOnSortChange).toHaveBeenCalledWith('added_at', 'asc')
  })

  it('renders quick action buttons', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    expect(screen.getByText('📖 Continue Reading')).toBeInTheDocument()
    expect(screen.getByText('🆕 Recently Added')).toBeInTheDocument()
    expect(screen.getByText('📚 Recently Read')).toBeInTheDocument()
  })

  it('calls onSortChange when quick action is clicked', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    const continueReadingButton = screen.getByText('📖 Continue Reading')
    fireEvent.click(continueReadingButton)
    
    expect(mockOnSortChange).toHaveBeenCalledWith('progress', 'asc')
  })

  it('shows mobile toggle button on small screens', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    expect(screen.getByText('Show Options')).toBeInTheDocument()
  })

  it('toggles filter visibility on mobile', () => {
    render(<LibraryFilters {...defaultProps} />)
    
    const toggleButton = screen.getByText('Show Options')
    fireEvent.click(toggleButton)
    
    expect(screen.getByText('Hide Options')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <LibraryFilters {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})