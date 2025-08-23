-- Add bundle_only field to books table
-- This field indicates whether a book should only appear within bundles
-- and not in the main books catalog

-- Add the bundle_only column
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS bundle_only BOOLEAN DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN books.bundle_only IS 'Indicates if this book should only appear within bundles and not in the main catalog';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_books_bundle_only ON books(bundle_only);

-- Create composite index for common queries (status + bundle_only)
CREATE INDEX IF NOT EXISTS idx_books_status_bundle_only ON books(status, bundle_only);

-- Update the search_books function to exclude bundle-only books by default
CREATE OR REPLACE FUNCTION search_books(
  search_query text DEFAULT '',
  category_filter text DEFAULT NULL,
  tags_filter text[] DEFAULT NULL,
  price_min decimal DEFAULT NULL,
  price_max decimal DEFAULT NULL,
  is_free_filter boolean DEFAULT NULL,
  status_filter text DEFAULT 'approved',
  include_bundle_only boolean DEFAULT false,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0,
  sort_by text DEFAULT 'relevance',
  sort_order text DEFAULT 'desc'
)
RETURNS TABLE (
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
  status text,
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
    b.status,
    b.created_at,
    b.updated_at,
    CASE 
      WHEN query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
      ELSE 0.0
    END as search_rank
  FROM books b
  WHERE 
    -- Status filter (default to approved only)
    (status_filter IS NULL OR b.status = status_filter)
    -- Bundle-only filter (exclude bundle-only books by default)
    AND (include_bundle_only = true OR b.bundle_only = false)
    -- Full-text search filter
    AND (query_tsquery IS NULL OR b.search_vector @@ query_tsquery)
    -- Category filter
    AND (category_filter IS NULL OR b.category = category_filter)
    -- Tags filter (any of the provided tags)
    AND (tags_filter IS NULL OR b.tags && tags_filter)
    -- Price range filter
    AND (price_min IS NULL OR b.price >= price_min)
    AND (price_max IS NULL OR b.price <= price_max)
    -- Free filter
    AND (is_free_filter IS NULL OR b.is_free = is_free_filter)
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' AND query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
      WHEN sort_by = 'title' THEN 0
      WHEN sort_by = 'author' THEN 0
      WHEN sort_by = 'price' THEN b.price::real
      WHEN sort_by = 'created_at' THEN EXTRACT(EPOCH FROM b.created_at)::real
      ELSE EXTRACT(EPOCH FROM b.created_at)::real
    END DESC,
    CASE 
      WHEN sort_by = 'title' THEN b.title
      WHEN sort_by = 'author' THEN b.author
      ELSE NULL
    END ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Update the unified_search function to exclude bundle-only books by default
CREATE OR REPLACE FUNCTION unified_search(
  search_query text DEFAULT '',
  include_books boolean DEFAULT true,
  include_bundles boolean DEFAULT true,
  include_bundle_only_books boolean DEFAULT false,
  category_filter text DEFAULT NULL,
  tags_filter text[] DEFAULT NULL,
  price_min decimal DEFAULT NULL,
  price_max decimal DEFAULT NULL,
  is_free_filter boolean DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  description text,
  cover_image_url text,
  price decimal,
  is_free boolean,
  category text,
  tags text[],
  item_type text,
  search_rank real,
  created_at timestamptz
) AS $$
DECLARE
  query_tsquery tsquery;
BEGIN
  -- Convert search query to tsquery if provided
  IF search_query IS NOT NULL AND search_query != '' THEN
    query_tsquery := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  (
    -- Books search (excluding bundle-only books by default)
    SELECT 
      b.id,
      b.title,
      b.author,
      b.description,
      b.cover_image_url,
      b.price,
      b.is_free,
      b.category,
      b.tags,
      'book'::text as item_type,
      CASE 
        WHEN query_tsquery IS NOT NULL THEN ts_rank(b.search_vector, query_tsquery)
        ELSE 0.0
      END as search_rank,
      b.created_at
    FROM books b
    WHERE 
      include_books = true
      AND b.status = 'approved'
      AND (include_bundle_only_books = true OR b.bundle_only = false)
      AND (query_tsquery IS NULL OR b.search_vector @@ query_tsquery)
      AND (category_filter IS NULL OR b.category = category_filter)
      AND (tags_filter IS NULL OR b.tags && tags_filter)
      AND (price_min IS NULL OR b.price >= price_min)
      AND (price_max IS NULL OR b.price <= price_max)
      AND (is_free_filter IS NULL OR b.is_free = is_free_filter)
  )
  UNION ALL
  (
    -- Bundles search
    SELECT 
      bu.id,
      bu.title,
      ''::text as author,
      bu.description,
      bu.cover_image_url,
      bu.price,
      false as is_free,
      ''::text as category,
      '{}'::text[] as tags,
      'bundle'::text as item_type,
      CASE 
        WHEN query_tsquery IS NOT NULL THEN ts_rank(bu.search_vector, query_tsquery)
        ELSE 0.0
      END as search_rank,
      bu.created_at
    FROM bundles bu
    WHERE 
      include_bundles = true
      AND (query_tsquery IS NULL OR bu.search_vector @@ query_tsquery)
      AND (price_min IS NULL OR bu.price >= price_min)
      AND (price_max IS NULL OR bu.price <= price_max)
  )
  ORDER BY search_rank DESC, created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
