// Admin book repository for admin-specific book operations

export interface AdminBookSearchOptions {
  query?: string;
  category?: string;
  isFree?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'title' | 'author' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export async function getAdminBooks(options: AdminBookSearchOptions = {}) {
  try {
    const params = new URLSearchParams();
    
    if (options.query) params.append('query', options.query);
    if (options.category) params.append('category', options.category);
    if (options.isFree !== undefined) params.append('is_free', options.isFree.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const url = `/api/admin/books?${params.toString()}`;
    console.log('Fetching admin books from:', url); // Debug log
    
    let response = await fetch(url);
    
    // If main endpoint fails, try test endpoint
    if (!response.ok) {
      console.warn('Main admin books endpoint failed, trying test endpoint');
      response = await fetch('/api/admin/books/test');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Admin books API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Admin books API response:', data); // Debug log
    
    return data.books || [];
  } catch (error) {
    console.error('Error in getAdminBooks:', error);
    throw error;
  }
}