import { createClient } from '@/lib/supabase/server';
import type { BlogPost, CreateBlogPostData, UpdateBlogPostData } from '@/lib/repositories/blogRepository';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BlogPostsFilter {
  limit?: number;
  published?: boolean;
  category?: string;
  search?: string;
}

class BlogService {
  /**
   * Get blog posts with filtering options
   */
  async getBlogPosts(filter: BlogPostsFilter = {}): Promise<ServiceResult<BlogPost[]>> {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.published !== undefined) {
        query = query.eq('published', filter.published);
      }

      if (filter.category) {
        query = query.eq('category', filter.category);
      }

      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,excerpt.ilike.%${filter.search}%`);
      }

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching blog posts:', error);
        return {
          success: false,
          error: 'Failed to fetch blog posts'
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Blog service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get a single blog post by ID
   */
  async getBlogPostById(id: string): Promise<ServiceResult<BlogPost>> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Blog post not found'
          };
        }
        console.error('Error fetching blog post:', error);
        return {
          success: false,
          error: 'Failed to fetch blog post'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Blog service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Create a new blog post (admin only)
   */
  async createBlogPost(data: CreateBlogPostData, userId: string): Promise<ServiceResult<BlogPost>> {
    try {
      const supabase = await createClient();
      
      // Verify admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'admin') {
        return {
          success: false,
          error: 'Admin access required'
        };
      }

      const { data: blogPost, error } = await supabase
        .from('blog_posts')
        .insert({
          ...data,
          author_id: userId,
          published_at: data.published ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating blog post:', error);
        return {
          success: false,
          error: 'Failed to create blog post'
        };
      }

      return {
        success: true,
        data: blogPost
      };
    } catch (error) {
      console.error('Blog service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Update an existing blog post (admin only)
   */
  async updateBlogPost(id: string, data: UpdateBlogPostData, userId: string): Promise<ServiceResult<BlogPost>> {
    try {
      const supabase = await createClient();
      
      // Verify admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'admin') {
        return {
          success: false,
          error: 'Admin access required'
        };
      }

      const updateData: any = { ...data };
      
      // Set published_at when publishing
      if (data.published === true) {
        updateData.published_at = new Date().toISOString();
      } else if (data.published === false) {
        updateData.published_at = null;
      }

      const { data: blogPost, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Blog post not found'
          };
        }
        console.error('Error updating blog post:', error);
        return {
          success: false,
          error: 'Failed to update blog post'
        };
      }

      return {
        success: true,
        data: blogPost
      };
    } catch (error) {
      console.error('Blog service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Delete a blog post (admin only)
   */
  async deleteBlogPost(id: string, userId: string): Promise<ServiceResult<boolean>> {
    try {
      const supabase = await createClient();
      
      // Verify admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'admin') {
        return {
          success: false,
          error: 'Admin access required'
        };
      }

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting blog post:', error);
        return {
          success: false,
          error: 'Failed to delete blog post'
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Blog service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get related blog posts based on category and tags
   */
  async getRelatedPosts(postId: string, limit: number = 3): Promise<ServiceResult<BlogPost[]>> {
    try {
      const supabase = await createClient();
      
      // First get the current post to find related ones
      const currentPostResult = await this.getBlogPostById(postId);
      if (!currentPostResult.success || !currentPostResult.data) {
        return {
          success: false,
          error: 'Post not found'
        };
      }

      const currentPost = currentPostResult.data;

      // Get posts from same category, excluding current post
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .eq('category', currentPost.category)
        .neq('id', postId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching related posts:', error);
        return {
          success: false,
          error: 'Failed to fetch related posts'
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Blog service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get blog categories with post counts
   */
  async getBlogCategories(): Promise<ServiceResult<Array<{ category: string; count: number }>>> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('category')
        .eq('published', true);

      if (error) {
        console.error('Error fetching blog categories:', error);
        return {
          success: false,
          error: 'Failed to fetch categories'
        };
      }

      // Count posts by category
      const categoryCount = (data || []).reduce((acc, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categories = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count
      }));

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      console.error('Blog service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }
}

export const blogService = new BlogService();