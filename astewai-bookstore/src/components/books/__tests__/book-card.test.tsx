import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { BookCard } from '../book-card'
import type { Book } from '@/types'

// Minimal mocks for Next.js components used by BookCard
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // strip boolean/non-DOM attributes that Next/Image sometimes passes
    const { fill, priority, unoptimized, ...rest } = props || {}
    return <img src={src} alt={alt} {...rest} />
  }
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  )
}))

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  description: 'Short description',
  cover_image_url: 'https://example.com/cover.jpg',
  content_url: null,
  price: 9.99,
  is_free: false,
  category: 'Fiction',
  tags: ['adventure'],
  bundle_only: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('BookCard', () => {
  it('renders the cover image and wrapper class exists', () => {
    const { container } = render(<BookCard book={mockBook} />)

    const img = screen.getByAltText(`Cover of ${mockBook.title}`)
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', mockBook.cover_image_url)

  // jsdom doesn't compute layout, but our aspect class should be present
  const elWithAspect = container.querySelector('[class*="aspect-"]')
  expect(elWithAspect).toBeTruthy()
  expect(elWithAspect?.className.includes('aspect-[2/3]')).toBe(true)
  })
})