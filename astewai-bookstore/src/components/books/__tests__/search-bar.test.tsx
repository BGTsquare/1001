import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SearchBar } from '../search-bar'

describe('SearchBar', () => {
  const mockOnSearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders with default placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search books by title, author, or keywords...')
    expect(input).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} placeholder="Custom placeholder" />)

    const input = screen.getByPlaceholderText('Custom placeholder')
    expect(input).toBeInTheDocument()
  })

  it('displays initial value', () => {
    render(<SearchBar onSearch={mockOnSearch} initialValue="initial search" />)

    const input = screen.getByDisplayValue('initial search')
    expect(input).toBeInTheDocument()
  })

  it('calls onSearch with debounced input', async () => {
    render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />)

    const input = screen.getByRole('textbox')
    
    // Type in the input
    await userEvent.type(input, 'test query')

    // Should not call onSearch immediately
    expect(mockOnSearch).not.toHaveBeenCalled()

    // Fast-forward time to trigger debounce
    vi.advanceTimersByTime(300)

    // Should call onSearch with the debounced value
    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('debounces multiple rapid inputs', async () => {
    render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />)

    const input = screen.getByRole('textbox')
    
    // Type multiple characters rapidly
    await userEvent.type(input, 'a')
    vi.advanceTimersByTime(100)
    
    await userEvent.type(input, 'b')
    vi.advanceTimersByTime(100)
    
    await userEvent.type(input, 'c')
    vi.advanceTimersByTime(100)

    // Should not have called onSearch yet
    expect(mockOnSearch).not.toHaveBeenCalled()

    // Fast-forward to complete debounce
    vi.advanceTimersByTime(300)

    // Should only call onSearch once with final value
    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith('abc')
  })

  it('shows clear button when input has value', async () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    
    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()

    // Type something
    await userEvent.type(input, 'test')

    // Clear button should appear
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('clears input when clear button is clicked', async () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    
    // Type something
    await userEvent.type(input, 'test query')
    expect(input).toHaveValue('test query')

    // Click clear button
    const clearButton = screen.getByLabelText('Clear search')
    await userEvent.click(clearButton)

    // Input should be cleared
    expect(input).toHaveValue('')

    // Should trigger search with empty string after debounce
    vi.advanceTimersByTime(300)
    expect(mockOnSearch).toHaveBeenCalledWith('')
  })

  it('triggers immediate search on form submit', async () => {
    render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />)

    const input = screen.getByRole('textbox')
    
    // Type something
    await userEvent.type(input, 'test query')

    // Submit form
    fireEvent.submit(input.closest('form')!)

    // Should call onSearch immediately without waiting for debounce
    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('prevents default form submission', async () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    const form = input.closest('form')!
    
    // Add event listener to check if preventDefault was called
    const mockPreventDefault = vi.fn()
    form.addEventListener('submit', (e) => {
      mockPreventDefault()
      expect(e.defaultPrevented).toBe(true)
    })
    
    // Submit form
    fireEvent.submit(form)

    // Should have prevented default
    expect(mockPreventDefault).toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Search books')

    // Type something to show clear button
    fireEvent.change(input, { target: { value: 'test' } })

    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toHaveAttribute('aria-label', 'Clear search')
  })

  it('applies custom className', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('calls onSearch with initial value on mount', async () => {
    render(<SearchBar onSearch={mockOnSearch} initialValue="initial" />)

    // Should call onSearch with initial value after debounce
    vi.advanceTimersByTime(300)
    expect(mockOnSearch).toHaveBeenCalledWith('initial')
  })
})