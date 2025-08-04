-- Advanced Search Migration
-- This script can be run manually in Supabase SQL Editor if local development isn't available

-- Add full-text search columns to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create a function to update the search vector
CREATE OR REPLACE FUNCTION update_book_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.author, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS books_search_vector_update ON books;
CREATE TRIGGER books_search_vector_update
  BEFORE INSERT OR UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_book_search_vector();

-- Update existing records
UPDATE books SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(author, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'D');

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_books_search_vector ON books USING GIN(search_vector);

-- Add search ranking function
CREATE OR REPLACE FUNCTION search_books(
  search_query text DEFAULT '',
  category_filter text DEFAULT NULL,
  tags_filter text[] DEFAULT NULL,
  price_min decimal DEFAULT NULL,
  price_max decimal DEFAULT NULL,
  is_free_filter boolean DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0,
  sort_by text DEFAULT 'relevance',
  sort_order text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  description text,
  cover_image_url text,
  content_url text,
  price decimal,
  is_free boolean,
  category text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  search_rank real
) AS $$
DECLARE
  query_tsquery tsquery;
BEGIN
  -- Convert search query to tsquery if provided
  IF search_query IS NOT NULL AND search_query != '' THEN
    query_tsquery := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.description,
    b.cover_image_url,
    b.content_url,
    b.price,
    b.is_free,
    b.category,
    b.tags,
    b.created_at,
    b.updated_at,
    CASE 
      WHEN query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
      ELSE 0.0
    END as search_rank
  FROM books b
  WHERE 
    -- Full-text search filter
    (query_tsquery IS NULL OR b.search_vector @@ query_tsquery)
    -- Category filter
    AND (category_filter IS NULL OR b.category = category_filter)
    -- Tags filter (any of the provided tags)
    AND (tags_filter IS NULL OR b.tags && tags_filter)
    -- Price range filter
    AND (price_min IS NULL OR b.price >= price_min)
    AND (price_max IS NULL OR b.price <= price_max)
    -- Free/paid filter
    AND (is_free_filter IS NULL OR b.is_free = is_free_filter)
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' AND query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
      ELSE NULL
    END DESC NULLS LAST,
    CASE WHEN sort_by = 'title' AND sort_order = 'asc' THEN b.title END ASC,
    CASE WHEN sort_by = 'title' AND sort_order = 'desc' THEN b.title END DESC,
    CASE WHEN sort_by = 'author' AND sort_order = 'asc' THEN b.author END ASC,
    CASE WHEN sort_by = 'author' AND sort_order = 'desc' THEN b.author END DESC,
    CASE WHEN sort_by = 'price' AND sort_order = 'asc' THEN b.price END ASC,
    CASE WHEN sort_by = 'price' AND sort_order = 'desc' THEN b.price END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN b.created_at END ASC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN b.created_at END DESC,
    b.created_at DESC -- Default fallback sort
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Add search suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_query text,
  suggestion_limit integer DEFAULT 10
)
RETURNS TABLE(suggestion text, frequency bigint) AS $$
BEGIN
  RETURN QUERY
  WITH word_frequencies AS (
    SELECT 
      word,
      COUNT(*) as freq
    FROM (
      SELECT unnest(string_to_array(lower(title), ' ')) as word FROM books
      UNION ALL
      SELECT unnest(string_to_array(lower(author), ' ')) as word FROM books
      UNION ALL
      SELECT unnest(tags) as word FROM books
      UNION ALL
      SELECT lower(category) as word FROM books WHERE category IS NOT NULL
    ) words
    WHERE 
      word LIKE lower(partial_query) || '%'
      AND length(word) > 2
      AND word NOT IN ('the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use')
    GROUP BY word
  )
  SELECT 
    word as suggestion,
    freq as frequency
  FROM word_frequencies
  ORDER BY freq DESC, word ASC
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- Add search analytics tracking table
CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query text NOT NULL,
  results_count integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW()
);

-- Create index for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);

-- Add function to track search queries
CREATE OR REPLACE FUNCTION track_search_query(
  query_text text,
  result_count integer DEFAULT 0,
  user_uuid uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO search_analytics (search_query, results_count, user_id)
  VALUES (query_text, result_count, user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Add function to get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
  time_period interval DEFAULT '30 days',
  search_limit integer DEFAULT 10
)
RETURNS TABLE(search_query text, search_count bigint, avg_results decimal) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.search_query,
    COUNT(*) as search_count,
    ROUND(AVG(sa.results_count), 2) as avg_results
  FROM search_analytics sa
  WHERE sa.created_at >= NOW() - time_period
    AND sa.search_query IS NOT NULL
    AND sa.search_query != ''
  GROUP BY sa.search_query
  HAVING COUNT(*) > 1  -- Only show searches that happened more than once
  ORDER BY search_count DESC, avg_results DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_books TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_search_query TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_popular_searches TO authenticated, anon;

-- Grant table permissions
GRANT SELECT, INSERT ON search_analytics TO authenticated;
GRANT SELECT ON search_analytics TO anon;