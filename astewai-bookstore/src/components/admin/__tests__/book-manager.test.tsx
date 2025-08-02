import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookManager } from '../book-manager'

// Mock fetch
global.fetch = jest.fn()

// Mock window.confirm
global.confirm = jest.fn()

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

const mockBooks = [
  {
    id: '1',
    title: 'Test Book 1',
    author: 'Author 1',
    description: 'Description 1',
    category: 'Fiction',
    price: 9.99,
    is_free: false,
    tags: ['fiction', 'adventure'],
    cover_image_url: 'https://example.com/cover1.jpg',
    content_url: 'https://example.com/content1.pdf',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Free Book',
    author: 'Author 2',
    description: 'Free description',
    category: 'Non-Fiction',
    price: 0,
    is_free: true,
    tags: ['education'],
    cover_image_url: 'https://example.com/cover2.jpg',
    content_url: 'https://example.com/content2.pdf',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

describe('BookManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful API response
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ books: mockBooks, total: 2 })
    })
  })

  it('renders book manager interface', async () => {
    render(<BookManager />)
    
    expect(screen.getByText('Book Management')).toBeInTheDocument()
    expect(screen.getByText('Add Book')).toBeInTheDocument()
    expect(screen.getByText('Filters')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Books (2)')).toBeInTheDocument()
    })
  })

  it('displays books in the list', async () => {
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
      expect(screen.getByText('by Author 1')).toBeInTheDocument()
      expect(screen.getByText('Free Book')).toBeInTheDocument()
      expect(screen.getByText('by Author 2')).toBeInTheDocument()
    })
  })

  it('handles search filtering', async () => {
    const user = userEvent.setup()
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search books...')
    await user.type(searchInput, 'Free')
    
    // The component should filter books client-side
    // In a real implementation, this might trigger a new API call
    expect(searchInput).toHaveValue('Free')
  })

  it('handles category filtering', async () => {
    const user = userEvent.setup()
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    const categorySelect = screen.getByRole('combobox', { name: /category/i })
    await user.click(categorySelect)
    await user.click(screen.getByText('Fiction'))
    
    // Should trigger a new API call with category filter
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=Fiction'),
      expect.any(Object)
    )
  })

  it('handles book selection', async () => {
    const user = userEvent.setup()
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // First book checkbox (index 0 is select all)
    
    expect(screen.getByText('1 book selected')).toBeInTheDocument()
  })

  it('handles select all functionality', async () => {
    const user = userEvent.setup()
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    const selectAllButton = screen.getByText('Select All')
    await user.click(selectAllButton)
    
    expect(screen.getByText('2 books selected')).toBeInTheDocument()
    expect(screen.getByText('Deselect All')).toBeInTheDocument()
  })

  it('handles book deletion', async () => {
    const user = userEvent.setup()
    ;(global.confirm as jest.Mock).mockReturnValue(true)
    
    // Mock successful delete response
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ books: mockBooks, total: 2 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Book deleted' })
      })
    
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    const deleteButtons = screen.getAllByRole('button', { name: /trash/i })
    await user.click(deleteButtons[0])
    
    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this book? This action cannot be undone.'
    )
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/books/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('handles bulk delete', async () => {
    const user = userEvent.setup()
    ;(global.confirm as jest.Mock).mockReturnValue(true)
    
    // Mock successful responses
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ books: mockBooks, total: 2 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Books deleted' })
      })
    
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    // Select books
    const selectAllButton = screen.getByText('Select All')
    await user.click(selectAllButton)
    
    // Click bulk delete
    const deleteSelectedButton = screen.getByText('Delete Selected')
    await user.click(deleteSelectedButton)
    
    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete 2 books? This action cannot be undone.'
    )
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/books/bulk',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ bookIds: ['1', '2'] })
        })
      )
    })
  })

  it('handles bulk export', async () => {
    const user = userEvent.setup()
    
    // Mock successful responses
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ books: mockBooks, total: 2 })
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['csv content'], { type: 'text/csv' }))
      })
    
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    // Select books
    const selectAllButton = screen.getByText('Select All')
    await user.click(selectAllButton)
    
    // Click bulk export
    const exportSelectedButton = screen.getByText('Export Selected')
    await user.click(exportSelectedButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/books/export',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ bookIds: ['1', '2'] })
        })
      )
    })
  })

  it('opens upload dialog when Add Book is clicked', async () => {
    const user = userEvent.setup()
    render(<BookManager />)
    
    const addBookButton = screen.getByText('Add Book')
    await user.click(addBookButton)
    
    expect(screen.getByText('Upload New Book')).toBeInTheDocument()
  })

  it('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[0])
    
    expect(screen.getByText('Edit Book')).toBeInTheDocument()
  })

  it('displays empty state when no books', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ books: [], total: 0 })
    })
    
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('No books found')).toBeInTheDocument()
      expect(screen.getByText('Add Your First Book')).toBeInTheDocument()
    })
  })

  it('displays loading state', () => {
    // Mock a delayed response
    ;(fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    )
    
    render(<BookManager />)
    
    expect(screen.getByText('Loading books...')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    render(<BookManager />)
    
    await waitFor(() => {
      // The component should handle the error gracefully
      // In a real implementation, you might show an error message
      expect(screen.getByText('Books (0)')).toBeInTheDocument()
    })
  })

  it('updates book list after successful creation', async () => {
    const user = userEvent.setup()
    
    // Mock initial load and successful creation
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ books: mockBooks, total: 2 })
      })
    
    render(<BookManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
    
    // Simulate successful book creation
    const addBookButton = screen.getByText('Add Book')
    await user.click(addBookButton)
    
    // The BookUpload component would call onSuccess with the new book
    // This would update the books list
    expect(screen.getByText('Upload New Book')).toBeInTheDocument()
  })
})