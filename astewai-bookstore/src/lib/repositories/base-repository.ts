import { createClient } from '@/lib/supabase/server';

// Generic result type for consistent error handling
export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status?: number;
}

export interface PaginatedResult<T> extends RepositoryResult<T[]> {
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Base repository class providing common functionality for all repositories
 */
export abstract class BaseRepository {
  protected supabase: any;
  protected isClient: boolean;

  constructor(isClient = false) {
    this.isClient = isClient;
    this.supabase = null; // Always initialize lazily
  }

  /**
   * Get Supabase client with proper initialization for client/server contexts
   */
  protected async getSupabaseClient() {
    if (this.isClient) {
      if (!this.supabase) {
        const { createClient: createClientClient } = await import('@/lib/supabase/client');
        this.supabase = createClientClient();
      }
      return this.supabase;
    } else {
      // Always create a fresh server client to avoid stale connections
      return await createClient();
    }
  }

  /**
   * Handle common database errors and return standardized error messages
   */
  protected handleDatabaseError(error: any, operation: string): RepositoryResult<never> {
    console.error(`Database error in ${operation}:`, error);
    
    // Handle specific error codes
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Record not found', code: 'NOT_FOUND', status: 404 };
    }
    
    if (error.code === '23505') {
      return { success: false, error: 'Record already exists', code: 'DUPLICATE', status: 409 };
    }
    
    if (error.code === '23503') {
      return { success: false, error: 'Referenced record not found', code: 'FOREIGN_KEY_VIOLATION', status: 400 };
    }
    
    return { 
      success: false, 
      error: error.message || `Failed to ${operation}`, 
      code: error.code,
      status: 500 
    };
  }

  /**
   * Execute a database operation with consistent error handling
   */
  protected async executeQuery<T>(
    operation: string,
    queryFn: (supabase: any) => Promise<{ data: T; error: any }>
  ): Promise<RepositoryResult<T>> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await queryFn(supabase);

      if (error) {
        return this.handleDatabaseError(error, operation);
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Unexpected error in ${operation}:`, error);
      return { success: false, error: `Failed to ${operation}`, status: 500 };
    }
  }

  /**
   * Execute a paginated query with consistent error handling
   */
  protected async executePaginatedQuery<T>(
    operation: string,
    queryFn: (supabase: any) => Promise<{ data: T[]; error: any; count?: number }>,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<T>> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error, count } = await queryFn(supabase);

      if (error) {
        const errorResult = this.handleDatabaseError(error, operation);
        return { ...errorResult, total: 0, page, limit };
      }

      return { 
        success: true, 
        data: data || [], 
        total: count || 0, 
        page, 
        limit 
      };
    } catch (error) {
      console.error(`Unexpected error in ${operation}:`, error);
      return { 
        success: false, 
        error: `Failed to ${operation}`, 
        status: 500,
        data: [],
        total: 0,
        page,
        limit
      };
    }
  }
}