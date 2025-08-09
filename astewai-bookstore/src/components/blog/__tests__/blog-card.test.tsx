import { render, screen } from '@testing-library/react';
import { BlogCard } from '../blog-card';
import { BlogPost } from '@/lib/repositories/blogRepository';

const mockPost: BlogPost = {
  id: '1',
  title: 'Test Blog Post',
  excerpt: 'This is a test excerpt for the blog post.',
  content: 'Full content here...',
  category: 'Technology',
  tags: ['test', 'blog', 'react'],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  published: true,
  author_id: 'admin'
};

describe('BlogCard', () => {
  it('renders blog post information correctly', () => {
    render(<BlogCard post={mockPost} />);

    expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test excerpt for the blog post.')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('blog')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('links to the correct blog post URL', () => {
    render(<BlogCard post={mockPost} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/1');
  });

  it('shows "+X more" when there are more than 3 tags', () => {
    const postWithManyTags = {
      ...mockPost,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    };

    render(<BlogCard post={postWithManyTags} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
  });

  it('handles posts without tags', () => {
    const postWithoutTags = {
      ...mockPost,
      tags: []
    };

    render(<BlogCard post={postWithoutTags} />);

    expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
    expect(screen.queryByText('test')).not.toBeInTheDocument();
  });
});