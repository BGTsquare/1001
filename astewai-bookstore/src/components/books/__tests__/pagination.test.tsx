import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Pagination, PaginationInfo } from '../pagination'

describe('Pagination', () => {
  const mockOnPageChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders page numbers correctly', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    // Should show all pages when total is small
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('highlights current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' })
    expect(currentPageButton).toHaveAttribute('aria-current', 'page')
  })

  it('calls onPageChange when page is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    const page4Button = screen.getByRole('button', { name: 'Go to page 4' })
    await user.click(page4Button)

    expect(mockOnPageChange).toHaveBeenCalledWith(4)
  })

  it('handles previous page navigation', async () => {
    const user = userEvent.setup()
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getByRole('button', { name: 'Go to previous page' })
    await user.click(prevButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('handles next page navigation', async () => {
    const user = userEvent.setup()
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByRole('button', { name: 'Go to next page' })
    await user.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(4)
  })

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    const prevButton = screen.getByRole('button', { name: 'Go to previous page' })
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByRole('button', { name: 'Go to next page' })
    expect(nextButton).toBeDisabled()
  })

  it('shows first and last buttons when enabled', async () => {
    const user = userEvent.setup()
    render(
      <Pagination
        currentPage={3}
        totalPages={10}
        onPageChange={mockOnPageChange}
        showFirstLast={true}
      />
    )

    const firstButton = screen.getByRole('button', { name: 'Go to first page' })
    const lastButton = screen.getByRole('button', { name: 'Go to last page' })

    expect(firstButton).toBeInTheDocument()
    expect(lastButton).toBeInTheDocument()

    await user.click(firstButton)
    expect(mockOnPageChange).toHaveBeenCalledWith(1)

    await user.click(lastButton)
    expect(mockOnPageChange).toHaveBeenCalledWith(10)
  })

  it('shows ellipsis for large page counts', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        onPageChange={mockOnPageChange}
        maxVisiblePages={5}
      />
    )

    // Should show ellipsis (rendered as SVG icons)
    const ellipsisElements = screen.getAllByRole('generic', { hidden: true })
    const ellipsisFound = ellipsisElements.some(el => el.getAttribute('aria-hidden') === 'true')
    expect(ellipsisFound).toBe(true)
  })

  it('applies custom className', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('PaginationInfo', () => {
  it('displays correct pagination information', () => {
    render(
      <PaginationInfo
        currentPage={2}
        totalPages={5}
        totalItems={47}
        itemsPerPage={10}
      />
    )

    expect(screen.getByText('Showing 11-20 of 47 books')).toBeInTheDocument()
  })

  it('handles last page correctly', () => {
    render(
      <PaginationInfo
        currentPage={5}
        totalPages={5}
        totalItems={47}
        itemsPerPage={10}
      />
    )

    expect(screen.getByText('Showing 41-47 of 47 books')).toBeInTheDocument()
  })

  it('handles first page correctly', () => {
    render(
      <PaginationInfo
        currentPage={1}
        totalPages={5}
        totalItems={47}
        itemsPerPage={10}
      />
    )

    expect(screen.getByText('Showing 1-10 of 47 books')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <PaginationInfo
        currentPage={1}
        totalPages={5}
        totalItems={47}
        itemsPerPage={10}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})