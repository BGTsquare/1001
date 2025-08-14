// Blog repository for managing blog posts

/**
 * Get the appropriate base URL for API calls
 * Handles both client-side and server-side rendering
 */
function getApiBaseUrl(): string {
  return typeof window !== 'undefined' 
    ? '' 
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

/**
 * Standard error response type for API calls
 */
interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Handle API response errors consistently
 */
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  
  try {
    const errorData: ApiErrorResponse = await response.json();
    errorMessage = errorData.error || errorMessage;
  } catch {
    // If response body isn't JSON, use the default message
  }
  
  throw new Error(errorMessage);
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  featured_image_url?: string;
  published_at?: string;
}

/**
 * Repository result type for better error handling
 */
export type RepositoryResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export interface BlogPostsOptions {
  limit?: number;
  published?: boolean;
  category?: string;
}

export interface CreateBlogPostData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  published: boolean;
  featured_image_url?: string;
}

export interface UpdateBlogPostData {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  featured_image_url?: string;
}

export async function getBlogPosts(options: BlogPostsOptions = {}): Promise<BlogPost[]> {
  try {
    const params = new URLSearchParams();
    
    if (options.published !== undefined) {
      params.append('published', options.published.toString());
    }
    if (options.category) {
      params.append('category', options.category);
    }
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    const response = await fetch(`${getApiBaseUrl()}/api/blog?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/blog/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch blog post');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}


export async function createBlogPost(data: CreateBlogPostData): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create blog post');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
}

export async function updateBlogPost(id: string, data: UpdateBlogPostData): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/blog/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update blog post');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/blog/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete blog post');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  // For now, treat slug as ID since we don't have actual slugs
  return getBlogPost(slug);
}

export async function getRelatedBlogPosts(postId: string, limit: number = 3): Promise<BlogPost[]> {
  try {
    const currentPost = await getBlogPost(postId);
    if (!currentPost) return [];
    
    const allPosts = await getBlogPosts({ published: true });
    
    // Find related posts by matching category or tags
    const relatedPosts = allPosts
      .filter(post => post.id !== postId)
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // Score by category match
        if (a.category === currentPost.category) scoreA += 3;
        if (b.category === currentPost.category) scoreB += 3;
        
        // Score by tag matches
        const currentTags = currentPost.tags || [];
        const tagsA = a.tags || [];
        const tagsB = b.tags || [];
        
        scoreA += tagsA.filter(tag => currentTags.includes(tag)).length;
        scoreB += tagsB.filter(tag => currentTags.includes(tag)).length;
        
        return scoreB - scoreA;
      })
      .slice(0, limit);
    
    return relatedPosts;
  } catch (error) {
    console.error('Error fetching related blog posts:', error);
    return [];
  }
}