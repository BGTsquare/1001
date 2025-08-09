import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlogManager } from '../blog-manager';
import * as blogRepository from '@/lib/repositories/blogRepository';

// Mock the blog repository
jest.mock('@/lib/repositories/blogRepository');
const mockGetBlogPosts = blogRepository.getBlogPosts as jest.MockedFunction<typeof blogRepository.getBlogPosts>;

const mockPosts = [
  {
    id: '1',
    title: 'Test Blog Post 1',
    excerpt: 'This is a test excerpt for post 1.',
    content: 'Full content here...',
    category: 'Technology',
    tags: ['test', 'blog'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    published: true,
    author_id: 'admin'
  },
  {
    id: '2',
    title: 'Test Blog Post 2',
    excerpt: 'This is a test excerpt for post 2.',
    content: 'Full content here...',
    category: 'Reviews',
    tags: ['test', 'review'],
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z',
    published: false,
    author_id: 'admin'
  }
];

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('BlogManager', () => {
  beforeEach(() => {
    mockGetBlogPosts.mockResolvedValue(mockPosts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders blog manager with posts', async () => {
    renderWithQueryClient(<BlogManager />);

    expect(screen.getByText('Blog Management')).toBeInTheDocument();
    expect(screen.getByText('Create, edit, and manage your blog posts')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
    });
  });

  it('displays correct stats', async () => {
    renderWithQueryClient(<BlogManager />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total posts
      expect(screen.getByText('1')).toBeInTheDocument(); // Published posts
      expect(screen.getByText('1')).toBeInTheDocument(); // Draft posts
    });
  });

  it('filters posts by search term', async () => {
    renderWithQueryClient(<BlogManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by title, category, or tags...');
    fireEvent.change(searchInput, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Blog Post 2')).not.toBeInTheDocument();
    });
  });

  it('shows published posts in published tab', async () => {
    renderWithQueryClient(<BlogManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
    });

    const publishedTab = screen.getByText('Published (1)');
    fireEvent.click(publishedTab);

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Blog Post 2')).not.toBeInTheDocument();
    });
  });

  it('shows draft posts in drafts tab', async () => {
    renderWithQueryClient(<BlogManager />);

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
    });

    const draftsTab = screen.getByText('Drafts (1)');
    fireEvent.click(draftsTab);

    await waitFor(() => {
      expect(screen.queryByText('Test Blog Post 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
    });
  });

  it('opens create dialog when new post button is clicked', async () => {
    renderWithQueryClient(<BlogManager />);

    const newPostButton = screen.getByText('New Post');
    fireEvent.click(newPostButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Blog Post')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockGetBlogPosts.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithQueryClient(<BlogManager />);

    expect(screen.getByText('Blog Management')).toBeInTheDocument();
    // Should show loading skeletons
  });

  it('handles error state', async () => {
    mockGetBlogPosts.mockRejectedValue(new Error('Failed to fetch'));

    renderWithQueryClient(<BlogManager />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load blog posts')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no posts exist', async () => {
    mockGetBlogPosts.mockResolvedValue([]);

    renderWithQueryClient(<BlogManager />);

    await waitFor(() => {
      expect(screen.getByText('No posts found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or create a new post.')).toBeInTheDocument();
    });
  });
});