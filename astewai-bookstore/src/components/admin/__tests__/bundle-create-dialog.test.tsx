import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BundleCreateDialog } from '../bundle-create-dialog'

// Mock the API calls
global.fetch = jest.fn()

const mockBooks = [
  {
    id: 'book1',
    title: 'Test Book 1',
    author: 'Test Author 1',
    price: 12.99,
    description: 'A test book',
    cover_image_url: '',
    content_url: '',
    is_free: false,
    category: 'Fiction',
    tags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'book2',
    title: 'Test Book 2',
    author: 'Test Author 2',
    price: 9.99,
    description: 'Another test book',
    cover_image_url: '',
    content_url: '',
    is_free: false,
    category: 'Non-Fiction',
    tags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  onSuccess: jest.fn()
}

describe('BundleCreateDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/books')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            books: mockBooks,
            total: mockBooks.length
          })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })
  })

  it('renders create bundle dialog', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    expect(screen.getByText('Create New Bundle')).toBeInTheDocument()
    expect(screen.getByText('Create a curated bundle of books with discounted pricing')).toBeInTheDocument()
  })

  it('shows form fields', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    expect(screen.getByLabelText('Bundle Title *')).toBeInTheDocument()
    expect(screen.getByLabelText('Bundle Price *')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('loads and displays available books', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
      expect(screen.getByText('Test Book 2')).toBeInTheDocument()
      expect(screen.getByText('by Test Author 1')).toBeInTheDocument()
      expect(screen.getByText('by Test Author 2')).toBeInTheDocument()
    })
  })

  it('allows selecting books', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })

    // Click checkbox to select book
    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.getByText('Selected Books')).toBeInTheDocument()
      expect(screen.getByText('1 selected')).toBeInTheDocument()
    })
  })

  it('calculates pricing summary when books are selected', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })

    // Select both books
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])

    // Fill in bundle price
    const priceInput = screen.getByLabelText('Bundle Price *')
    fireEvent.change(priceInput, { target: { value: '19.99' } })

    await waitFor(() => {
      expect(screen.getByText('Total Book Price')).toBeInTheDocument()
      expect(screen.getByText('$22.98')).toBeInTheDocument() // 12.99 + 9.99
      expect(screen.getByText('Bundle Price')).toBeInTheDocument()
      expect(screen.getByText('$19.99')).toBeInTheDocument()
      expect(screen.getByText('Customer Savings')).toBeInTheDocument()
      expect(screen.getByText(/\$2\.99/)).toBeInTheDocument() // 22.98 - 19.99
    })
  })

  it('validates required fields', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    const submitButton = screen.getByText('Create Bundle')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Bundle title is required')).toBeInTheDocument()
      expect(screen.getByText('Valid price is required')).toBeInTheDocument()
      expect(screen.getByText('At least one book must be selected')).toBeInTheDocument()
    })
  })

  it('validates bundle pricing rules', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByLabelText('Bundle Title *'), { 
      target: { value: 'Test Bundle' } 
    })
    fireEvent.change(screen.getByLabelText('Bundle Price *'), { 
      target: { value: '25.00' } // Higher than total book price
    })

    // Select a book
    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    const submitButton = screen.getByText('Create Bundle')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Bundle price cannot exceed total book prices')).toBeInTheDocument()
    })
  })

  it('validates minimum discount requirement', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })

    // Fill form with price too close to book price
    fireEvent.change(screen.getByLabelText('Bundle Title *'), { 
      target: { value: 'Test Bundle' } 
    })
    fireEvent.change(screen.getByLabelText('Bundle Price *'), { 
      target: { value: '12.95' } // Only 4 cents discount
    })

    // Select a book
    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    const submitButton = screen.getByText('Create Bundle')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Bundle must provide at least 1% discount')).toBeInTheDocument()
    })
  })

  it('handles book search', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    const searchInput = screen.getByPlaceholderText('Search books to add to bundle...')
    fireEvent.change(searchInput, { target: { value: 'Test Book 1' } })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=Test%20Book%201')
      )
    })
  })

  it('allows removing selected books', async () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })

    // Select a book
    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.getByText('Selected Books')).toBeInTheDocument()
    })

    // Remove the book
    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.getByText('0 selected')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-bundle-id' })
    })
    ;(fetch as jest.Mock).mockImplementation((url, options) => {
      if (options?.method === 'POST' && url.includes('/api/admin/bundles')) {
        return mockCreate()
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          books: mockBooks,
          total: mockBooks.length
        })
      })
    })

    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })

    // Fill form
    fireEvent.change(screen.getByLabelText('Bundle Title *'), { 
      target: { value: 'Test Bundle' } 
    })
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'A test bundle description' } 
    })
    fireEvent.change(screen.getByLabelText('Bundle Price *'), { 
      target: { value: '19.99' } 
    })

    // Select books
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])

    const submitButton = screen.getByText('Create Bundle')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })
  })

  it('handles API errors', async () => {
    ;(fetch as jest.Mock).mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Failed to create bundle' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          books: mockBooks,
          total: mockBooks.length
        })
      })
    })

    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })

    // Fill valid form
    fireEvent.change(screen.getByLabelText('Bundle Title *'), { 
      target: { value: 'Test Bundle' } 
    })
    fireEvent.change(screen.getByLabelText('Bundle Price *'), { 
      target: { value: '19.99' } 
    })

    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    const submitButton = screen.getByText('Create Bundle')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to create bundle')).toBeInTheDocument()
    })
  })

  it('closes dialog when cancelled', () => {
    render(<BundleCreateDialog {...defaultProps} />, { wrapper: createWrapper() })

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not render when closed', () => {
    render(<BundleCreateDialog {...defaultProps} open={false} />, { wrapper: createWrapper() })

    expect(screen.queryByText('Create New Bundle')).not.toBeInTheDocument()
  })
})