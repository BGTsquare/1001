// Blog repository for managing blog posts
// This is a placeholder implementation for the blog functionality

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  published: boolean;
  author_id: string;
}

export interface BlogPostsOptions {
  limit?: number;
  published?: boolean;
  category?: string;
}

// Mock blog posts data for demonstration
const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of Digital Reading',
    excerpt: 'Exploring how digital books are changing the way we read and learn.',
    content: 'Full content here...',
    category: 'Technology',
    tags: ['digital', 'reading', 'future'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    published: true,
    author_id: 'admin'
  },
  {
    id: '2',
    title: 'Top 10 Books of 2024',
    excerpt: 'Our curated list of must-read books from this year.',
    content: 'Full content here...',
    category: 'Reviews',
    tags: ['books', '2024', 'recommendations'],
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z',
    published: true,
    author_id: 'admin'
  },
  {
    id: '3',
    title: 'Building Your Personal Library',
    excerpt: 'Tips and strategies for curating a meaningful book collection.',
    content: 'Full content here...',
    category: 'Tips',
    tags: ['library', 'collection', 'tips'],
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z',
    published: true,
    author_id: 'admin'
  }
];

export async function getBlogPosts(options: BlogPostsOptions = {}): Promise<BlogPost[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let posts = [...mockBlogPosts];
  
  // Filter by published status
  if (options.published !== undefined) {
    posts = posts.filter(post => post.published === options.published);
  }
  
  // Filter by category
  if (options.category) {
    posts = posts.filter(post => post.category.toLowerCase() === options.category.toLowerCase());
  }
  
  // Apply limit
  if (options.limit) {
    posts = posts.slice(0, options.limit);
  }
  
  return posts;
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const post = mockBlogPosts.find(post => post.id === id);
  return post || null;
}