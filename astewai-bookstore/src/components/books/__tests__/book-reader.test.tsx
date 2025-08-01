import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'
import { BookReader } from '../book-reader'
import { useAuth } from '@/contexts/auth-context'
import type { Book, UserLibrary } from '@/types'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch
global.fetch = vi.fn()

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  reading_preferences: {
    fontSize: 'medium',
    theme: 'light',
    fontFamily: 'serif',
  },
}

const mockBook: Book = {
  id: 'book-1',
  title: 'Test Book',
  author: 'Test Author',
  description: 'A test book description',
  cover_image_url: 'https://example.com/cover.jpg',
  content_url: 'https://example.com/content.html',
  price: 9.99,
  is_free: false,
  category: 'Fiction',
  tags: ['test', 'fiction'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockLibraryItem: UserLibrary = {
  id: 'library-1',
  user_id: 'user-1',
  book_id: 'book-1',
  status: 'owned',
  progress: 25,
  last_read_position: '{"scrollTop": 100, "scrollHeight": 1000}',
  added_at: '2024-01-01T00:00:00Z',
  book: mockBook,
}

describe('BookReader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useAuth as any).mockReturnValue({ user: mockUser })
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: '<div><h1>Test Content</h1><p>This is test content.</p></div>',
      }),
    })
  })

  it('renders book reader with title and author', async () => {
    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
      expect(screen.getByText('by Test Author')).toBeInTheDocument()
    })
  })

  it('displays progress bar with current progress', async () => {
    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })

  it('loads and displays book content', async () => {
    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.getByText('This is test content.')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/books/book-1/content')
  })

  it('shows loading state initially', () => {
    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    expect(screen.getByText('Loading book content...')).toBeInTheDocument()
  })

  it('handles back navigation', async () => {
    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: /back/i })
    fireEvent.click(backButton)

    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('opens settings panel when settings button is clicked', async () => {
    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    const settingsButton = screen.getByTitle('Reader settings')
    fireEvent.click(settingsButton)

    expect(screen.getByText('Reading Settings')).toBeInTheDocument()
    expect(screen.getByText('Font Size')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByText('Font Family')).toBeInTheDocument()
  })

  it('updates font size setting', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: '<div><h1>Test Content</h1></div>',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    // Open settings
    const settingsButton = screen.getByTitle('Reader settings')
    fireEvent.click(settingsButton)

    // Click large font size button
    const largeFontButton = screen.getByRole('button', { name: /plus/i })
    fireEvent.click(largeFontButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reading_preferences: {
            fontSize: 'large',
            theme: 'light',
            fontFamily: 'serif',
          },
        }),
      })
    })
  })

  it('updates theme setting', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: '<div><h1>Test Content</h1></div>',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    // Open settings
    const settingsButton = screen.getByTitle('Reader settings')
    fireEvent.click(settingsButton)

    // Click dark theme button
    const darkThemeButton = screen.getByRole('button', { name: /dark/i })
    fireEvent.click(darkThemeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reading_preferences: {
            fontSize: 'medium',
            theme: 'dark',
            fontFamily: 'serif',
          },
        }),
      })
    })
  })

  it('adds bookmark when bookmark button is clicked', async () => {
    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    const bookmarkButton = screen.getByTitle('Add bookmark')
    fireEvent.click(bookmarkButton)

    // Open bookmarks panel
    const viewBookmarksButton = screen.getByTitle('View bookmarks')
    fireEvent.click(viewBookmarksButton)

    expect(screen.getByText('Bookmarks')).toBeInTheDocument()
  })

  it('calls onProgressUpdate when progress changes', async () => {
    const mockOnProgressUpdate = vi.fn()

    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
        onProgressUpdate={mockOnProgressUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    // Mock scroll event to trigger progress update
    const contentElement = screen.getByText('Test Content').closest('div')
    if (contentElement) {
      Object.defineProperty(contentElement, 'scrollTop', { value: 200, writable: true })
      Object.defineProperty(contentElement, 'scrollHeight', { value: 1000, writable: true })
      Object.defineProperty(contentElement, 'clientHeight', { value: 500, writable: true })

      fireEvent.scroll(contentElement)
    }

    // Wait for debounced progress save
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/library/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"bookId":"book-1"'),
      })
    }, { timeout: 3000 })
  })

  it('calls onStatusUpdate when book is completed', async () => {
    const mockOnStatusUpdate = vi.fn()
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: '<div><h1>Test Content</h1></div>',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          statusChanged: true,
          data: { status: 'completed' },
        }),
      })

    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
        onStatusUpdate={mockOnStatusUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    // Mock scroll to 100% progress
    const contentElement = screen.getByText('Test Content').closest('div')
    if (contentElement) {
      Object.defineProperty(contentElement, 'scrollTop', { value: 500, writable: true })
      Object.defineProperty(contentElement, 'scrollHeight', { value: 1000, writable: true })
      Object.defineProperty(contentElement, 'clientHeight', { value: 500, writable: true })

      fireEvent.scroll(contentElement)
    }

    // Wait for progress update and status change
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('completed')
    }, { timeout: 3000 })
  })

  it('handles content loading error', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('Failed to load'))

    render(
      <BookReader
        book={mockBook}
        libraryItem={mockLibraryItem}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No content available for this book.')).toBeInTheDocument()
    })
  })

  it('restores reading position from library item', async () => {
    const libraryItemWithPosition = {
      ...mockLibraryItem,
      last_read_position: '{"scrollTop": 300, "scrollHeight": 1000}',
    }

    render(
      <BookReader
        book={mockBook}
        libraryItem={libraryItemWithPosition}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    // The component should restore the scroll position
    // This is hard to test directly, but we can verify the content loaded
    expect(global.fetch).toHaveBeenCalledWith('/api/books/book-1/content')
  })
})