# Advanced Search Implementation

This document outlines the advanced search functionality implemented for the Astewai Digital Bookstore.

## Overview

The advanced search system provides intelligent, fast, and user-friendly search capabilities with the following key features:

- **PostgreSQL Full-Text Search**: Leverages PostgreSQL's built-in full-text search capabilities with custom ranking
- **Search Suggestions**: Real-time autocomplete suggestions based on user input and search history
- **Advanced Filtering**: Category, price range, tags, and free/paid book filters
- **Search Analytics**: Performance tracking and user behavior analysis
- **Caching**: Client-side caching for improved performance
- **Unified Search**: Search across both books and bundles simultaneously

## Database Implementation

### Full-Text Search Setup

**Migration: `004_advanced_search.sql`**

- Added `search_vector` column to books and bundles tables
- Implemented weighted full-text search vectors:
  - Title: Weight A (highest priority)
  - Author: Weight B
  - Description: Weight C
  - Tags/Category: Weight D (lowest priority)
- Created GIN indexes for optimal search performance
- Added automatic triggers to update search vectors on data changes

### Search Functions

**`search_books()`**: Advanced book search with filtering and ranking
- Full-text search with relevance ranking
- Category, price range, and tag filtering
- Flexible sorting options (relevance, title, author, price, date)
- Pagination support

**`get_search_suggestions()`**: Autocomplete suggestions
- Based on word frequency analysis
- Filters out common stop words
- Returns suggestions with usage frequency

**`track_search_query()`**: Search analytics tracking
- Records search queries and result counts
- Supports user-specific tracking when authenticated

**`get_popular_searches()`**: Popular search queries
- Time-based popularity analysis
- Configurable time periods and result limits

**`unified_search()`**: Combined books and bundles search
- Single query across multiple content types
- Unified ranking and sorting

## Frontend Implementation

### Components

**SearchBar** (`src/components/books/search-bar.tsx`)
- Debounced input to prevent excessive API calls
- Real-time search suggestions dropdown
- Popular searches display
- Keyboard navigation support
- Search highlighting

**AdvancedSearchFilters** (`src/components/books/advanced-search-filters.tsx`)
- Category selection
- Price range slider
- Tag filtering with checkboxes
- Free/paid book toggle
- Collapsible interface for mobile

**SearchResults** (`src/components/books/search-results.tsx`)
- Search term highlighting in results
- Relevance ranking display
- Loading and empty states
- Result count and pagination info

**AdvancedSearchPage** (`src/components/books/advanced-search-page.tsx`)
- Complete search interface
- Tabbed search types (Books, Bundles, All)
- URL parameter synchronization
- Popular searches sidebar

### Services

**SearchCacheService** (`src/lib/services/search-cache-service.ts`)
- Client-side result caching with TTL
- LRU eviction policy
- Cache statistics and monitoring
- Prefetching for popular queries
- Cache warmup for common searches

**SearchAnalyticsService** (`src/lib/services/search-analytics-service.ts`)
- Search performance metrics
- User behavior tracking
- Conversion rate analysis
- Query performance monitoring
- Search pattern analysis

### Repository Layer

**ClientBookRepository** (`src/lib/repositories/client-book-repository.ts`)
- Enhanced with advanced search RPC calls
- Fallback to basic search if advanced search fails
- Search suggestion and analytics integration
- Unified search across content types

## Performance Optimizations

### Database Level
- GIN indexes on search vectors for fast full-text search
- Composite indexes for common filter combinations
- Optimized query plans with proper statistics

### Application Level
- Search result caching with configurable TTL
- Debounced search input (300ms default)
- Pagination to limit result set size
- Lazy loading of filter options

### User Experience
- Loading states and skeleton screens
- Progressive enhancement with fallbacks
- Keyboard navigation support
- Mobile-responsive design

## Analytics and Monitoring

### Tracked Metrics
- Search query frequency and performance
- Zero-result queries for content gap analysis
- Slow queries for optimization opportunities
- User click-through rates
- Filter usage patterns
- Search conversion rates

### Performance Monitoring
- Average search response time
- Cache hit rates
- Database query performance
- Client-side rendering metrics

## Testing

### Unit Tests
- Repository layer search functions
- Cache service operations
- Analytics service tracking
- Component rendering and interactions

### Integration Tests
- End-to-end search workflows
- Filter combinations
- Search suggestion functionality
- Performance under load

## Usage Examples

### Basic Search
```typescript
const result = await clientBookService.searchBooks({
  query: 'science fiction',
  limit: 20,
  sortBy: 'relevance'
})
```

### Advanced Filtering
```typescript
const result = await clientBookService.searchBooks({
  query: 'programming',
  category: 'Technology',
  priceRange: [0, 25],
  tags: ['javascript', 'web development'],
  isFree: false,
  limit: 10,
  offset: 0
})
```

### Unified Search
```typescript
const result = await clientBookService.unifiedSearch({
  query: 'machine learning',
  includeBooks: true,
  includeBundles: true,
  limit: 15
})
```

### Search Suggestions
```typescript
const suggestions = await clientBookService.getSearchSuggestions('prog', 5)
// Returns: ['programming', 'progressive', 'program', ...]
```

## Configuration

### Cache Settings
```typescript
const cacheService = new SearchCacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  enableLogging: process.env.NODE_ENV === 'development'
})
```

### Search Parameters
- Default debounce: 300ms
- Default page size: 12 items
- Max suggestions: 8 items
- Cache TTL: 5 minutes
- Max cache size: 100 entries

## Future Enhancements

### Planned Features
- Semantic search with vector embeddings
- Machine learning-based ranking
- Personalized search results
- Voice search support
- Advanced query syntax (AND, OR, NOT operators)

### Performance Improvements
- Server-side caching with Redis
- Search result preloading
- CDN integration for static assets
- Database connection pooling optimization

## Maintenance

### Regular Tasks
- Monitor search performance metrics
- Analyze zero-result queries for content gaps
- Update search indexes and statistics
- Review and optimize slow queries
- Clean up old analytics data

### Troubleshooting
- Check database search function performance
- Verify cache hit rates and TTL settings
- Monitor client-side error rates
- Validate search result accuracy
- Test fallback mechanisms

This implementation provides a robust, scalable, and user-friendly search experience that can handle the growing needs of the digital bookstore platform.