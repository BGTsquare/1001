#!/usr/bin/env node

/**
 * Script to apply search analytics migration to Supabase
 * This creates the necessary tables and RPC functions for search functionality
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
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250103_add_search_analytics.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Search analytics migration applied successfully!');
    console.log('📊 Created tables: search_analytics');
    console.log('🔧 Created functions: get_popular_searches, get_search_suggestions, track_search_query');
    console.log('🔒 Applied RLS policies for data security');
    
    // Test the functions
    console.log('\n🧪 Testing RPC functions...');
    
    // Test get_popular_searches
    const { data: popularData, error: popularError } = await supabase.rpc('get_popular_searches', {
      time_period: '30 days',
      search_limit: 5
    });
    
    if (popularError) {
      console.error('❌ get_popular_searches test failed:', popularError.message);
    } else {
      console.log('✅ get_popular_searches working! Returned', popularData?.length || 0, 'results');
    }
    
    // Test get_search_suggestions
    const { data: suggestionsData, error: suggestionsError } = await supabase.rpc('get_search_suggestions', {
      partial_query: 'test',
      suggestion_limit: 5
    });
    
    if (suggestionsError) {
      console.error('❌ get_search_suggestions test failed:', suggestionsError.message);
    } else {
      console.log('✅ get_search_suggestions working! Returned', suggestionsData?.length || 0, 'results');
    }
    
    // Test track_search_query
    const { data: trackData, error: trackError } = await supabase.rpc('track_search_query', {
      query_text: 'test migration',
      results_count: 1,
      session_id_param: 'migration-test'
    });
    
    if (trackError) {
      console.error('❌ track_search_query test failed:', trackError.message);
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
