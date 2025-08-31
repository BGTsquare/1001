/**
 * Fallback data for when API calls fail due to deployment protection or other issues
 */

import type { Book, Bundle } from '@/types'

export const fallbackBooks: Book[] = [
  {
    id: '1',
    title: 'The Art of Programming',
    author: 'Jane Developer',
    description: 'A comprehensive guide to software development best practices and methodologies. Learn how to write clean, maintainable code and follow industry standards.',
    price: 29.99,
    is_free: false,
    category: 'Technology',
    tags: ['programming', 'software', 'development', 'best-practices'],
    cover_image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=600&fit=crop&crop=center',
    content_url: null,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Free Introduction to Web Development',
    author: 'John Coder',
    description: 'Learn the basics of HTML, CSS, and JavaScript in this beginner-friendly guide. Perfect for those starting their web development journey.',
    price: 0,
    is_free: true,
    category: 'Technology',
    tags: ['web', 'html', 'css', 'javascript', 'beginner'],
    cover_image_url: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=600&fit=crop&crop=center',
    content_url: null,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Database Design Fundamentals',
    author: 'Sarah Database',
    description: 'Master the principles of database design, normalization, and optimization. Essential knowledge for any developer working with data.',
    price: 24.99,
    is_free: false,
    category: 'Technology',
    tags: ['database', 'sql', 'design', 'optimization'],
    cover_image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=600&fit=crop&crop=center',
    content_url: null,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Advanced React Patterns',
    author: 'Mike Frontend',
    description: 'Dive deep into advanced React concepts, patterns, and best practices. Learn hooks, context, performance optimization, and more.',
    price: 34.99,
    is_free: false,
    category: 'Technology',
    tags: ['react', 'javascript', 'frontend', 'patterns'],
    cover_image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=600&fit=crop&crop=center',
    content_url: null,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Python for Data Science',
    author: 'Dr. Data Scientist',
    description: 'Learn Python programming specifically for data science applications. Covers pandas, numpy, matplotlib, and machine learning basics.',
    price: 39.99,
    is_free: false,
    category: 'Technology',
    tags: ['python', 'data-science', 'machine-learning', 'analytics'],
    cover_image_url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=600&fit=crop&crop=center',
    content_url: null,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'DevOps Best Practices',
    author: 'Alex Operations',
    description: 'Master DevOps methodologies, CI/CD pipelines, containerization, and cloud deployment strategies for modern applications.',
    price: 44.99,
    is_free: false,
    category: 'Technology',
    tags: ['devops', 'ci-cd', 'docker', 'kubernetes', 'cloud'],
    cover_image_url: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=400&h=600&fit=crop&crop=center',
    content_url: null,
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

export const fallbackBundles: Bundle[] = [
  {
    id: '1',
    title: 'Web Development Starter Pack',
    description: 'Everything you need to start your web development journey. Includes HTML, CSS, JavaScript, and React fundamentals.',
    price: 49.99,
    cover_image_url: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&h=400&fit=crop&crop=center',
    books: [fallbackBooks[1], fallbackBooks[3]], // Free Web Dev + Advanced React
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Full Stack Developer Bundle',
    description: 'Complete full-stack development package covering frontend, backend, databases, and deployment strategies.',
    price: 89.99,
    cover_image_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop&crop=center',
    books: [fallbackBooks[0], fallbackBooks[2], fallbackBooks[5]], // Programming + Database + DevOps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

/**
 * Get fallback books when API fails
 */
export function getFallbackBooks(options: {
  limit?: number
  category?: string
  isFree?: boolean
} = {}): { books: Book[]; total: number } {
  let filteredBooks = [...fallbackBooks]

  // Apply filters
  if (options.category) {
    filteredBooks = filteredBooks.filter(book => 
      book.category?.toLowerCase() === options.category?.toLowerCase()
    )
  }

  if (options.isFree !== undefined) {
    filteredBooks = filteredBooks.filter(book => book.is_free === options.isFree)
  }

  // Apply limit
  if (options.limit) {
    filteredBooks = filteredBooks.slice(0, options.limit)
  }

  return {
    books: filteredBooks,
    total: filteredBooks.length
  }
}

/**
 * Get fallback bundles when API fails
 */
export function getFallbackBundles(): Bundle[] {
  return [...fallbackBundles]
}

/**
 * Get a single fallback book by ID
 */
export function getFallbackBookById(id: string): Book | null {
  return fallbackBooks.find(book => book.id === id) || null
}

/**
 * Get a single fallback bundle by ID
 */
export function getFallbackBundleById(id: string): Bundle | null {
  return fallbackBundles.find(bundle => bundle.id === id) || null
}
