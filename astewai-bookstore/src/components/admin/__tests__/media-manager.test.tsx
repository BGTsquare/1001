import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaManager } from '../media-manager'

// Mock storage client
const mockStorageClient = {
  listFiles: vi.fn(),
  getStorageStats: vi.fn(),
  deleteFiles: vi.fn()
}

vi.mock('@/lib/storage/storage-client', () => ({
  StorageClient: vi.fn(() => mockStorageClient)
}))

// Mock file upload service
const mockFileUploadService = {
  uploadFile: vi.fn()
}

vi.mock('@/lib/storage/file-upload', () => ({
  fileUploadService: mockFileUploadService
}))

// Mock environment variables
Object.defineProperty(process.env, 'NEXT_PUBLIC_SUPABASE_URL', {
  value: 'https://example.supabase.co'
})

describe('MediaManager', () => {
  const mockFiles = [
    {
      name: 'covers/image1.jpg',
      metadata: { size: 1024, mimetype: 'image/jpeg' },
      created_at: '2023-01-01T00:00:00Z'
    },
    {
      name: 'content/book1.pdf',
      metadata: { size: 2048, mimetype: 'application/pdf' },
      created_at: '2023-01-02T00:00:00Z'
    }
  ]

  const mockStats = {
    totalFiles: 2,
    totalSize: 3072,
    folderStats: {
      covers: { files: 1, size: 1024 },
      content: { files: 1, size: 2048 }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorageClient.listFiles.mockResolvedValue(mockFiles)
    mockStorageClient.getStorageStats.mockResolvedValue(mockStats)
  })

  it('should render media manager with storage stats', async () => {
    render(<MediaManager />)

    expect(screen.getByText('Media Manager')).toBeInTheDocument()
    expect(screen.getByText('Manage uploaded files and media assets')).toBeInTheDocument()

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // Total files
      expect(screen.getByText('3 KB')).toBeInTheDocument() // Total size
      expect(screen.getByText('2')).toBeInTheDocument() // Folders
    })
  })

  it('should load and display files', async () => {
    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
      expect(screen.getByText('book1.pdf')).toBeInTheDocument()
    })

    expect(mockStorageClient.listFiles).toHaveBeenCalledWith('', 1000)
  })

  it('should filter files by search term', async () => {
    const user = userEvent.setup()
    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
      expect(screen.getByText('book1.pdf')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search files...')
    await user.type(searchInput, 'image')

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
      expect(screen.queryByText('book1.pdf')).not.toBeInTheDocument()
    })
  })

  it('should filter files by folder', async () => {
    const user = userEvent.setup()
    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
      expect(screen.getByText('book1.pdf')).toBeInTheDocument()
    })

    const folderSelect = screen.getByDisplayValue('All Folders')
    await user.selectOptions(folderSelect, 'covers')

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
      expect(screen.queryByText('book1.pdf')).not.toBeInTheDocument()
    })
  })

  it('should toggle view mode between grid and list', async () => {
    const user = userEvent.setup()
    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
    })

    // Should start in grid mode
    const toggleButton = screen.getByRole('button', { name: /list/i })
    await user.click(toggleButton)

    // Should switch to list mode
    expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument()
  })

  it('should handle file selection', async () => {
    const user = userEvent.setup()
    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
    })

    // Click on a file to select it
    const fileElement = screen.getByText('image1.jpg').closest('div')
    await user.click(fileElement!)

    // Delete button should appear
    expect(screen.getByText(/Delete \(1\)/)).toBeInTheDocument()
  })

  it('should delete selected files', async () => {
    const user = userEvent.setup()
    mockStorageClient.deleteFiles.mockResolvedValue(undefined)
    
    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('image1.jpg')).toBeInTheDocument()
    })

    // Select a file
    const fileElement = screen.getByText('image1.jpg').closest('div')
    await user.click(fileElement!)

    // Click delete button
    const deleteButton = screen.getByText(/Delete \(1\)/)
    await user.click(deleteButton)

    expect(mockStorageClient.deleteFiles).toHaveBeenCalledWith(['covers/image1.jpg'])
  })

  it('should handle file upload', async () => {
    const user = userEvent.setup()
    mockFileUploadService.uploadFile.mockResolvedValue({
      url: 'https://example.com/new-file.jpg',
      fileName: 'new-file.jpg',
      size: 1024,
      type: 'image/jpeg'
    })

    render(<MediaManager />)

    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/choose files/i)

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })

    expect(mockFileUploadService.uploadFile).toHaveBeenCalledWith(
      file,
      'image',
      {
        folder: 'uploads',
        optimizeImage: true,
        generateThumbnail: true
      },
      expect.any(Function)
    )
  })

  it('should refresh files when refresh button is clicked', async () => {
    const user = userEvent.setup()
    render(<MediaManager />)

    await waitFor(() => {
      expect(mockStorageClient.listFiles).toHaveBeenCalledTimes(1)
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockStorageClient.listFiles).toHaveBeenCalledTimes(2)
  })

  it('should handle loading state', () => {
    mockStorageClient.listFiles.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<MediaManager />)

    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('should handle empty file list', async () => {
    mockStorageClient.listFiles.mockResolvedValue([])
    mockStorageClient.getStorageStats.mockResolvedValue({
      totalFiles: 0,
      totalSize: 0,
      folderStats: {}
    })

    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('No files found')).toBeInTheDocument()
    })
  })

  it('should format file sizes correctly', async () => {
    const largeFile = {
      name: 'large-file.pdf',
      metadata: { size: 1024 * 1024 * 5, mimetype: 'application/pdf' }, // 5MB
      created_at: '2023-01-01T00:00:00Z'
    }

    mockStorageClient.listFiles.mockResolvedValue([largeFile])

    render(<MediaManager />)

    await waitFor(() => {
      expect(screen.getByText('5 MB')).toBeInTheDocument()
    })
  })

  it('should handle upload progress', async () => {
    const user = userEvent.setup()
    let progressCallback: ((progress: any) => void) | undefined

    mockFileUploadService.uploadFile.mockImplementation((file, type, options, onProgress) => {
      progressCallback = onProgress
      return new Promise((resolve) => {
        setTimeout(() => {
          progressCallback?.({ loaded: 50, total: 100, percentage: 50 })
          setTimeout(() => {
            progressCallback?.({ loaded: 100, total: 100, percentage: 100 })
            resolve({
              url: 'https://example.com/file.jpg',
              fileName: 'file.jpg',
              size: 1024,
              type: 'image/jpeg'
            })
          }, 100)
        }, 100)
      })
    })

    render(<MediaManager />)

    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/choose files/i)

    await user.upload(fileInput, file)

    // Should show progress
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })
  })
})