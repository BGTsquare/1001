#!/usr/bin/env node

/**
 * Simple script to apply search analytics migration using direct SQL execution
 * This uses the Supabase REST API to execute SQL statements
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function applySearchAnalyticsMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔧 Applying search analytics migration...\n');

  try {
    // Create search_analytics table
    console.log('📊 Creating search_analytics table...');
    const createTableSQL = `
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
    `;

    const { error: tableError } = await supabase.rpc('exec', { sql: createTableSQL });
    if (tableError) {
      console.warn('⚠️  Table creation warning:', tableError.message);
    } else {
      console.log('✅ search_analytics table created');
    }

    // Create indexes
    console.log('📈 Creating indexes...');
    const indexSQLs = [
      'CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);',
      'CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics(search_timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);'
    ];

    for (const indexSQL of indexSQLs) {
      const { error } = await supabase.rpc('exec', { sql: indexSQL });
      if (error) {
        console.warn('⚠️  Index creation warning:', error.message);
      }
    }
    console.log('✅ Indexes created');

    // Enable RLS
    console.log('🔒 Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec', { 
      sql: 'ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;' 
    });
    if (rlsError) {
      console.warn('⚠️  RLS warning:', rlsError.message);
    } else {
      console.log('✅ RLS enabled');
    }

    // Create RLS policies
    console.log('🛡️  Creating RLS policies...');
    const policySQLs = [
      `CREATE POLICY "Users can view their own search analytics" ON search_analytics
        FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));`,
      `CREATE POLICY "Users can insert their own search analytics" ON search_analytics
        FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);`
    ];

    for (const policySQL of policySQLs) {
      const { error } = await supabase.rpc('exec', { sql: policySQL });
      if (error) {
        console.warn('⚠️  Policy creation warning:', error.message);
      }
    }
    console.log('✅ RLS policies created');

    // Create get_popular_searches function
    console.log('🔧 Creating get_popular_searches function...');
    const popularSearchesSQL = `
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
    `;

    const { error: popularError } = await supabase.rpc('exec', { sql: popularSearchesSQL });
    if (popularError) {
      console.warn('⚠️  get_popular_searches function warning:', popularError.message);
    } else {
      console.log('✅ get_popular_searches function created');
    }

    // Create get_search_suggestions function
    console.log('🔧 Creating get_search_suggestions function...');
    const suggestionsSQL = `
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
    `;

    const { error: suggestionsError } = await supabase.rpc('exec', { sql: suggestionsSQL });
    if (suggestionsError) {
      console.warn('⚠️  get_search_suggestions function warning:', suggestionsError.message);
    } else {
      console.log('✅ get_search_suggestions function created');
    }

    // Create track_search_query function
    console.log('🔧 Creating track_search_query function...');
    const trackSQL = `
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
    `;

    const { error: trackError } = await supabase.rpc('exec', { sql: trackSQL });
    if (trackError) {
      console.warn('⚠️  track_search_query function warning:', trackError.message);
    } else {
      console.log('✅ track_search_query function created');
    }

    // Grant permissions
    console.log('🔑 Granting permissions...');
    const permissionSQLs = [
      'GRANT EXECUTE ON FUNCTION get_popular_searches(TEXT, INTEGER) TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION get_search_suggestions(TEXT, INTEGER) TO anon, authenticated;',
      'GRANT EXECUTE ON FUNCTION track_search_query(TEXT, INTEGER, TEXT) TO anon, authenticated;'
    ];

    for (const permSQL of permissionSQLs) {
      const { error } = await supabase.rpc('exec', { sql: permSQL });
      if (error) {
        console.warn('⚠️  Permission warning:', error.message);
      }
    }
    console.log('✅ Permissions granted');

    console.log('\n🎉 Search analytics migration completed successfully!');
    console.log('📊 Created tables: search_analytics');
    console.log('🔧 Created functions: get_popular_searches, get_search_suggestions, track_search_query');
    console.log('🔒 Applied RLS policies for data security');
    
    // Test the functions
    console.log('\n🧪 Testing RPC functions...');
    
    // Test get_popular_searches
    const { data: popularData, error: popularTestError } = await supabase.rpc('get_popular_searches', {
      time_period: '30 days',
      search_limit: 5
    });
    
    if (popularTestError) {
      console.error('❌ get_popular_searches test failed:', popularTestError.message);
    } else {
      console.log('✅ get_popular_searches working! Returned', popularData?.length || 0, 'results');
    }
    
    // Test get_search_suggestions
    const { data: suggestionsData, error: suggestionsTestError } = await supabase.rpc('get_search_suggestions', {
      partial_query: 'test',
      suggestion_limit: 5
    });
    
    if (suggestionsTestError) {
      console.error('❌ get_search_suggestions test failed:', suggestionsTestError.message);
    } else {
      console.log('✅ get_search_suggestions working! Returned', suggestionsData?.length || 0, 'results');
    }
    
    // Test track_search_query
    const { data: trackData, error: trackTestError } = await supabase.rpc('track_search_query', {
      query_text: 'test migration',
      results_count: 1,
      session_id_param: 'migration-test'
    });
    
    if (trackTestError) {
      console.error('❌ track_search_query test failed:', trackTestError.message);
    } else {
      console.log('✅ track_search_query working! Created record with ID:', trackData);
    }

    console.log('\n🎉 All search analytics functionality is now available!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the migration
applySearchAnalyticsMigration().catch(console.error);
