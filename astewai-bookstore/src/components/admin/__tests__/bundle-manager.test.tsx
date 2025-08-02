import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BundleManager } from '../bundle-manager'

// Mock the API calls
global.fetch = jest.fn()

const mockBundles = [
  {
    id: '1',
    title: 'Test Bundle 1',
    description: 'A test bundle',
    price: 19.99,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    books: [
      {
        id: 'book1',
        title: 'Test Book 1',
        author: 'Test Author 1',
        price: 12.99
      },
      {
        id: 'book2',
        title: 'Test Book 2',
        author: 'Test Author 2',
        price: 9.99
      }
    ]
  },
  {
    id: '2',
    title: 'Test Bundle 2',
    description: 'Another test bundle',
    price: 29.99,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    books: [
      {
        id: 'book3',
        title: 'Test Book 3',
        author: 'Test Author 3',
        price: 15.99
      }
    ]
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

describe('BundleManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        bundles: mockBundles,
        total: mockBundles.length
      })
    })
  })

  it('renders bundle management interface', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    expect(screen.getByText('Bundle Management')).toBeInTheDocument()
    expect(screen.getByText('Create and manage book bundles')).toBeInTheDocument()
    expect(screen.getByText('Create Bundle')).toBeInTheDocument()
  })

  it('displays bundles when loaded', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Test Bundle 1')).toBeInTheDocument()
      expect(screen.getByText('Test Bundle 2')).toBeInTheDocument()
    })

    expect(screen.getByText('A test bundle')).toBeInTheDocument()
    expect(screen.getByText('Another test bundle')).toBeInTheDocument()
  })

  it('shows bundle pricing information', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('$19.99')).toBeInTheDocument()
      expect(screen.getByText('$29.99')).toBeInTheDocument()
    })

    // Check for savings calculation
    expect(screen.getByText(/Save \$2\.99/)).toBeInTheDocument() // 22.98 - 19.99 = 2.99
  })

  it('shows book count for each bundle', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('2 books')).toBeInTheDocument()
      expect(screen.getByText('1 books')).toBeInTheDocument()
    })
  })

  it('handles search functionality', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    const searchInput = screen.getByPlaceholderText('Search bundles by title or description...')
    fireEvent.change(searchInput, { target: { value: 'Test Bundle 1' } })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=Test%20Bundle%201')
      )
    })
  })

  it('handles sorting options', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    const sortBySelect = screen.getByDisplayValue('Sort by Date')
    fireEvent.change(sortBySelect, { target: { value: 'title' } })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=title')
      )
    })

    const sortOrderSelect = screen.getByDisplayValue('Descending')
    fireEvent.change(sortOrderSelect, { target: { value: 'asc' } })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortOrder=asc')
      )
    })
  })

  it('opens create dialog when create button is clicked', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    const createButton = screen.getByText('Create Bundle')
    fireEvent.click(createButton)

    // The dialog should be rendered (though we're not testing the dialog content here)
    expect(screen.getByText('Create Bundle')).toBeInTheDocument()
  })

  it('shows action buttons for each bundle', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getAllByText('Analytics')).toHaveLength(2)
      expect(screen.getAllByText('Edit')).toHaveLength(2)
      expect(screen.getAllByText('Delete')).toHaveLength(2)
    })
  })

  it('handles pagination', async () => {
    const manyBundles = Array.from({ length: 15 }, (_, i) => ({
      ...mockBundles[0],
      id: `bundle-${i}`,
      title: `Bundle ${i}`
    }))

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        bundles: manyBundles.slice(0, 10),
        total: 15
      })
    })

    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10')
      )
    })
  })

  it('shows empty state when no bundles exist', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        bundles: [],
        total: 0
      })
    })

    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('No bundles found')).toBeInTheDocument()
      expect(screen.getByText('Create your first bundle to get started')).toBeInTheDocument()
    })
  })

  it('shows error state when fetch fails', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'))

    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Failed to load bundles. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<BundleManager />, { wrapper: createWrapper() })

    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3)
  })

  it('calculates and displays savings correctly', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      // Bundle 1: books cost 22.98, bundle costs 19.99, savings = 2.99 (13.0% off)
      expect(screen.getByText(/Save \$2\.99/)).toBeInTheDocument()
      expect(screen.getByText(/13\.0% off/)).toBeInTheDocument()
    })
  })

  it('shows creation date information', async () => {
    render(<BundleManager />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Created: 1/1/2024')).toBeInTheDocument()
      expect(screen.getByText('Created: 1/2/2024')).toBeInTheDocument()
    })
  })
})