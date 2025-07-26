import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { BookFiltersComponent } from '../book-filters'
import type { BookFilters } from '@/types'

describe('BookFiltersComponent', () => {
  const mockOnFiltersChange = vi.fn()
  const mockCategories = ['Fiction', 'Non-Fiction', 'Science', 'History']
  const mockTags = ['adventure', 'mystery', 'romance', 'thriller', 'biography']

  const defaultProps = {
    filters: {} as BookFilters,
    onFiltersChange: mockOnFiltersChange,
    categories: mockCategories,
    tags: mockTags
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter header with expand/collapse button', () => {
    render(<BookFiltersComponent {...defaultProps} />)

    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByLabelText('Expand filters')).toBeInTheDocument()
  })

  it('expands and collapses filter content', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Initially collapsed
    expect(screen.queryByText('Price')).not.toBeInTheDocument()

    // Click to expand
    const expandButton = screen.getByLabelText('Expand filters')
    await user.click(expandButton)

    // Should show filter content
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByLabelText('Collapse filters')).toBeInTheDocument()

    // Click to collapse
    const collapseButton = screen.getByLabelText('Collapse filters')
    await user.click(collapseButton)

    // Should hide filter content
    expect(screen.queryByText('Price')).not.toBeInTheDocument()
  })

  it('displays price filter options', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('handles price filter selection', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    // Click Free button
    const freeButton = screen.getByRole('button', { name: 'Free' })
    await user.click(freeButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ isFree: true })
    )
  })

  it('displays categories when available', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('Non-Fiction')).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('handles category selection', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    // Click Fiction category
    const fictionButton = screen.getByRole('button', { name: 'Fiction' })
    await user.click(fictionButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Fiction' })
    )
  })

  it('displays tags when available', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('adventure')).toBeInTheDocument()
    expect(screen.getByText('mystery')).toBeInTheDocument()
    expect(screen.getByText('romance')).toBeInTheDocument()
  })

  it('handles tag selection and deselection', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    // Click adventure tag
    const adventureButton = screen.getByRole('button', { name: 'adventure' })
    await user.click(adventureButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['adventure'] })
    )

    // Click again to deselect
    await user.click(adventureButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ tags: undefined })
    )
  })

  it('shows clear all button when filters are active', async () => {
    const user = userEvent.setup()
    const filtersWithValues: BookFilters = {
      category: 'Fiction',
      isFree: true
    }

    render(
      <BookFiltersComponent
        {...defaultProps}
        filters={filtersWithValues}
      />
    )

    expect(screen.getByText('Clear all')).toBeInTheDocument()

    // Click clear all
    await user.click(screen.getByText('Clear all'))

    // Should reset all filters
    expect(mockOnFiltersChange).toHaveBeenCalledWith({})
  })

  it('does not show clear all button when no filters are active', () => {
    render(<BookFiltersComponent {...defaultProps} />)

    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
  })

  it('shows price range slider only for paid books', async () => {
    const user = userEvent.setup()
    render(<BookFiltersComponent {...defaultProps} />)

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    // Initially should show price range (when "All" is selected)
    expect(screen.getByText('Price Range')).toBeInTheDocument()

    // Select Free books
    await user.click(screen.getByRole('button', { name: 'Free' }))

    // Price range should be hidden
    expect(screen.queryByText('Price Range')).not.toBeInTheDocument()

    // Select Paid books
    await user.click(screen.getByRole('button', { name: 'Paid' }))

    // Price range should be visible again
    expect(screen.getByText('Price Range')).toBeInTheDocument()
  })

  it('does not render category section when no categories provided', async () => {
    const user = userEvent.setup()
    render(
      <BookFiltersComponent
        {...defaultProps}
        categories={[]}
      />
    )

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    expect(screen.queryByText('Category')).not.toBeInTheDocument()
  })

  it('does not render tags section when no tags provided', async () => {
    const user = userEvent.setup()
    render(
      <BookFiltersComponent
        {...defaultProps}
        tags={[]}
      />
    )

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    expect(screen.queryByText('Tags')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <BookFiltersComponent
        {...defaultProps}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('initializes with provided filter values', async () => {
    const user = userEvent.setup()
    const initialFilters: BookFilters = {
      category: 'Fiction',
      tags: ['adventure', 'mystery'],
      isFree: false
    }

    render(
      <BookFiltersComponent
        {...defaultProps}
        filters={initialFilters}
      />
    )

    // Expand filters
    await user.click(screen.getByLabelText('Expand filters'))

    // Fiction category should be selected
    const fictionButton = screen.getByRole('button', { name: 'Fiction' })
    expect(fictionButton).toHaveClass('bg-primary') // Assuming selected state has this class

    // Paid should be selected
    const paidButton = screen.getByRole('button', { name: 'Paid' })
    expect(paidButton).toHaveClass('bg-primary')
  })
})