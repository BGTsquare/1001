# Advanced Search Setup Guide

This guide explains how to set up the advanced search functionality for the Astewai Digital Bookstore.

## Overview

The advanced search system includes:
- PostgreSQL full-text search with weighted ranking
- Search suggestions and autocomplete
- Popular searches tracking
- Search analytics and performance monitoring
- Graceful fallbacks when advanced features are unavailable

## Setup Options

### Option 1: Local Development with Supabase CLI (Recommended)

1. **Prerequisites**
   - Docker Desktop installed and running
   - Supabase CLI installed (`npm install -g supabase`)

2. **Start Local Supabase**
   ```bash
   cd astewai-bookstore
   pnpm supabase start
   ```

3. **Apply Migration**
   The migration will be applied automatically when you start Supabase. If you need to apply it manually:
   ```bash
   pnpm supabase db reset
   ```

4. **Verify Setup**
   - Check that the `search_books` function exists in your local database
   - Test the search functionality in the application

### Option 2: Remote Supabase Instance

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run Migration Script**
   - Copy the contents of `scripts/apply-search-migration.sql`
   - Paste and execute in the SQL Editor

3. **Verify Functions**
   - Check that the following functions were created:
     - `search_books()`
     - `get_search_suggestions()`
     - `track_search_query()`
     - `get_popular_searches()`

### Option 3: Fallback Mode (No Migration Required)

The application includes comprehensive fallbacks that work without the advanced search migration:

- **Basic Search**: Uses standard PostgreSQL ILIKE queries
- **Simple Suggestions**: Based on existing book titles, authors, and categories
- **Default Popular Searches**: Uses book categories as popular search terms
- **No Analytics**: Search tracking is disabled but doesn't affect functionality

## Features Available

### With Advanced Search Migration

✅ **Full-Text Search**: Weighted search across title, author, description, tags, and category  
✅ **Relevance Ranking**: Results ranked by search relevance score  
✅ **Smart Suggestions**: Autocomplete based on search frequency and word analysis  
✅ **Popular Searches**: Real-time tracking of popular search terms  
✅ **Search Analytics**: Performance metrics and user behavior tracking  
✅ **Advanced Filtering**: Category, price range, tags, and free/paid filters  

### Fallback Mode (No Migration)

✅ **Basic Search**: Simple text matching across title, author, and description  
✅ **Basic Suggestions**: Suggestions from existing book data  
✅ **Default Popular Searches**: Category-based popular searches  
✅ **Advanced Filtering**: All filtering options still work  
❌ **Relevance Ranking**: Results sorted by creation date instead  
❌ **Search Analytics**: No tracking or performance metrics  

## Testing the Setup

### 1. Test Basic Search
```typescript
// This should work in both modes
const result = await clientBookService.searchBooks({
  query: 'programming',
  limit: 10
})
```

### 2. Test Advanced Features
```typescript
// This will use advanced search if available, fallback otherwise
const suggestions = await clientBookService.getSearchSuggestions('prog', 5)
const popular = await clientBookService.getPopularSearches('7 days', 10)
```

### 3. Check Browser Console
- Advanced search working: No error messages
- Fallback mode: Warning messages about unavailable features

## Troubleshooting

### "Error fetching books with advanced search"
- **Cause**: The `search_books` function doesn't exist in the database
- **Solution**: Apply the migration script or use fallback mode
- **Verification**: Check if you see "falling back to basic search" in console

### Search suggestions not working
- **Cause**: The `get_search_suggestions` function is missing
- **Solution**: Apply the migration or rely on basic suggestions
- **Fallback**: Basic suggestions from book titles/authors will be used

### No popular searches showing
- **Cause**: The `get_popular_searches` function is missing
- **Solution**: Apply the migration or use default popular searches
- **Fallback**: Book categories will be shown as popular searches

### Performance issues
- **Cause**: Missing database indexes
- **Solution**: Ensure the migration created the GIN indexes
- **Check**: Look for `idx_books_search_vector` index in your database

## Migration Details

The migration creates:

### Database Objects
- `search_vector` column on books table
- GIN indexes for full-text search
- Triggers for automatic search vector updates
- `search_analytics` table for tracking

### Functions
- `search_books()`: Advanced search with ranking
- `get_search_suggestions()`: Autocomplete suggestions
- `track_search_query()`: Analytics tracking
- `get_popular_searches()`: Popular search queries
- `update_book_search_vector()`: Search vector maintenance

### Permissions
- Execute permissions for authenticated and anonymous users
- Table permissions for search analytics

## Performance Considerations

### With Advanced Search
- **Search Speed**: ~10-50ms for typical queries
- **Index Size**: ~10-20% of table size for search vectors
- **Memory Usage**: Moderate increase for GIN indexes

### Fallback Mode
- **Search Speed**: ~50-200ms for typical queries
- **Index Usage**: Standard B-tree indexes only
- **Memory Usage**: Minimal overhead

## Monitoring

### Advanced Search Metrics
```typescript
// Get performance metrics (advanced mode only)
const metrics = clientBookService.getSearchMetrics()
console.log('Average search time:', metrics.averageSearchTime)
console.log('Popular queries:', metrics.popularQueries)
```

### Health Checks
- Monitor search response times
- Check for fallback mode warnings in logs
- Verify search result relevance and accuracy

## Future Enhancements

When the advanced search is fully set up, you can enable:
- Semantic search with vector embeddings
- Machine learning-based ranking
- Personalized search results
- Advanced query syntax (AND, OR, NOT)
- Search result caching with Redis

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify database functions exist in Supabase dashboard
3. Test with fallback mode to isolate issues
4. Review the migration script for any missing steps

The system is designed to work gracefully in all scenarios, so users will always have a functional search experience regardless of the setup complexity.