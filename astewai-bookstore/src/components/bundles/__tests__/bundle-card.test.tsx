import { render, screen } from '@testing-library/react'
import { BundleCard } from '../bundle-card'
import type { Bundle } from '@/types'

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ alt, ...props }: any) {
    return <img alt={alt} {...props} />
  }
})

jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>
  }
})

const mockBundle: Bundle = {
  id: 'bundle-1',
  title: 'Programming Fundamentals Bundle',
  description: 'A comprehensive collection of programming books for beginners',
  price: 49.99,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  books: [
    {
      id: 'book-1',
      title: 'JavaScript Basics',
      author: 'John Doe',
      description: 'Learn JavaScript fundamentals',
      cover_image_url: 'https://example.com/js-book.jpg',
      content_url: 'https://example.com/js-content',
      price: 19.99,
      is_free: false,
      category: 'Programming',
      tags: ['javascript', 'web'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'book-2',
      title: 'Python for Beginners',
      author: 'Jane Smith',
      description: 'Introduction to Python programming',
      cover_image_url: 'https://example.com/python-book.jpg',
      content_url: 'https://example.com/python-content',
      price: 24.99,
      is_free: false,
      category: 'Programming',
      tags: ['python', 'beginners'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'book-3',
      title: 'Web Development Guide',
      author: 'Bob Johnson',
      description: 'Complete guide to web development',
      cover_image_url: 'https://example.com/web-book.jpg',
      content_url: 'https://example.com/web-content',
      price: 29.99,
      is_free: false,
      category: 'Web Development',
      tags: ['html', 'css', 'javascript'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]
}

describe('BundleCard', () => {
  it('renders bundle information correctly', () => {
    render(<BundleCard bundle={mockBundle} />)

    expect(screen.getByText('Programming Fundamentals Bundle')).toBeInTheDocument()
    expect(screen.getByText('A comprehensive collection of programming books for beginners')).toBeInTheDocument()
    expect(screen.getByText('3 books')).toBeInTheDocument()
    expect(screen.getByText('$49.99')).toBeInTheDocument()
  })

  it('calculates and displays savings correctly', () => {
    render(<BundleCard bundle={mockBundle} />)

    // Total book price: 19.99 + 24.99 + 29.99 = 74.97
    // Bundle price: 49.99
    // Savings: 74.97 - 49.99 = 24.98
    expect(screen.getByText('$74.97')).toBeInTheDocument() // Original price (crossed out)
    expect(screen.getByText('Save $24.98')).toBeInTheDocument()
  })

  it('displays discount percentage correctly', () => {
    render(<BundleCard bundle={mockBundle} />)

    // Discount: (24.98 / 74.97) * 100 ≈ 33%
    expect(screen.getByText('33% OFF')).toBeInTheDocument()
  })

  it('renders book covers in grid layout', () => {
    render(<BundleCard bundle={mockBundle} />)

    const bookImages = screen.getAllByRole('img')
    expect(bookImages).toHaveLength(3) // 3 books in the bundle
    expect(bookImages[0]).toHaveAttribute('alt', 'Cover of JavaScript Basics')
    expect(bookImages[1]).toHaveAttribute('alt', 'Cover of Python for Beginners')
    expect(bookImages[2]).toHaveAttribute('alt', 'Cover of Web Development Guide')
  })

  it('renders action buttons', () => {
    render(<BundleCard bundle={mockBundle} />)

    expect(screen.getByText('View Details')).toBeInTheDocument()
    expect(screen.getByText('Buy Bundle')).toBeInTheDocument()
  })

  it('handles bundle with no books', () => {
    const emptyBundle: Bundle = {
      ...mockBundle,
      books: []
    }

    render(<BundleCard bundle={emptyBundle} />)

    expect(screen.getByText('0 books')).toBeInTheDocument()
    expect(screen.getByText('$49.99')).toBeInTheDocument()
    // Should not show savings when there are no books
    expect(screen.queryByText(/Save/)).not.toBeInTheDocument()
  })

  it('handles bundle with more than 4 books', () => {
    const largeBundleBooks = [
      ...mockBundle.books!,
      {
        id: 'book-4',
        title: 'React Fundamentals',
        author: 'Alice Brown',
        description: 'Learn React basics',
        cover_image_url: 'https://example.com/react-book.jpg',
        content_url: 'https://example.com/react-content',
        price: 22.99,
        is_free: false,
        category: 'Frontend',
        tags: ['react', 'javascript'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'book-5',
        title: 'Node.js Guide',
        author: 'Charlie Wilson',
        description: 'Backend development with Node.js',
        cover_image_url: 'https://example.com/node-book.jpg',
        content_url: 'https://example.com/node-content',
        price: 26.99,
        is_free: false,
        category: 'Backend',
        tags: ['nodejs', 'javascript'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]

    const largeBundle: Bundle = {
      ...mockBundle,
      books: largeBundleBooks
    }

    render(<BundleCard bundle={largeBundle} />)

    expect(screen.getByText('5 books')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument() // Shows remaining count
  })

  it('handles books without cover images', () => {
    const bundleWithoutCovers: Bundle = {
      ...mockBundle,
      books: [
        {
          ...mockBundle.books![0],
          cover_image_url: null
        }
      ]
    }

    render(<BundleCard bundle={bundleWithoutCovers} />)

    // Should render placeholder icon instead of image
    const bookOpenIcons = screen.getAllByTestId('book-open-icon') || []
    expect(bookOpenIcons.length).toBeGreaterThan(0)
  })

  it('creates correct links', () => {
    render(<BundleCard bundle={mockBundle} />)

    const titleLink = screen.getByRole('link', { name: 'Programming Fundamentals Bundle' })
    expect(titleLink).toHaveAttribute('href', '/bundles/bundle-1')

    const detailsLink = screen.getByRole('link', { name: 'View Details' })
    expect(detailsLink).toHaveAttribute('href', '/bundles/bundle-1')
  })

  it('applies custom className', () => {
    const { container } = render(<BundleCard bundle={mockBundle} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})