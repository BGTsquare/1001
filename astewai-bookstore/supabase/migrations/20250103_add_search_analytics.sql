-- Add search analytics functionality
-- This migration adds search tracking and popular searches functionality

-- Create search_analytics table to track search queries
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  results_count INTEGER DEFAULT 0,
  search_timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics(search_timestamp);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);

-- Enable RLS
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own search analytics
CREATE POLICY "Users can view their own search analytics" ON search_analytics
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- RLS Policy: Users can insert their own search analytics
CREATE POLICY "Users can insert their own search analytics" ON search_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(
  time_period TEXT DEFAULT '30 days',
  search_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  search_query TEXT,
  search_count BIGINT,
  avg_results NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.search_query,
    COUNT(*) as search_count,
    ROUND(AVG(sa.results_count), 2) as avg_results
  FROM search_analytics sa
  WHERE sa.search_timestamp >= NOW() - (time_period::INTERVAL)
    AND sa.search_query IS NOT NULL
    AND LENGTH(TRIM(sa.search_query)) > 0
  GROUP BY sa.search_query
  ORDER BY search_count DESC, avg_results DESC
  LIMIT search_limit;
END;
$$;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_query TEXT,
  suggestion_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  frequency BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return empty if query is too short
  IF LENGTH(TRIM(partial_query)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    sa.search_query as suggestion,
    COUNT(*) as frequency
  FROM search_analytics sa
  WHERE sa.search_query ILIKE '%' || partial_query || '%'
    AND sa.search_query IS NOT NULL
    AND LENGTH(TRIM(sa.search_query)) > 0
  GROUP BY sa.search_query
  ORDER BY frequency DESC, sa.search_query
  LIMIT suggestion_limit;
END;
$$;

-- Function to track search queries
CREATE OR REPLACE FUNCTION track_search_query(
  query_text TEXT,
  results_count INTEGER DEFAULT 0,
  session_id_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Only track if query is meaningful
  IF LENGTH(TRIM(query_text)) < 2 THEN
    RETURN NULL;
  END IF;

  INSERT INTO search_analytics (
    search_query,
    user_id,
    results_count,
    session_id
  ) VALUES (
    TRIM(query_text),
    auth.uid(),
    results_count,
    session_id_param
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_popular_searches(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION track_search_query(TEXT, INTEGER, TEXT) TO anon, authenticated;
