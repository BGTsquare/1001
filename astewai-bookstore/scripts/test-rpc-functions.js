const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test script to verify RPC functions are working
async function testRPCFunctions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Testing Supabase RPC functions...\n');

  // Test 1: search_books function
  console.log('1️⃣ Testing search_books function...');
  try {
    const { data, error } = await supabase.rpc('search_books', {
      search_query: '',
      category_filter: null,
      tags_filter: null,
      price_min: null,
      price_max: null,
      is_free_filter: null,
      include_bundle_only: false,
      limit_count: 5,
      offset_count: 0,
      sort_by: 'created_at',
      sort_order: 'desc'
    });

    if (error) {
      console.error('❌ search_books error:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('✅ search_books working! Returned', data?.length || 0, 'results');
    }
  } catch (err) {
    console.error('❌ search_books exception:', err.message);
  }

  console.log('');

  // Test 2: get_popular_searches function
  console.log('2️⃣ Testing get_popular_searches function...');
  try {
    const { data, error } = await supabase.rpc('get_popular_searches', {
      time_period: '30 days',
      search_limit: 5
    });

    if (error) {
      console.error('❌ get_popular_searches error:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('✅ get_popular_searches working! Returned', data?.length || 0, 'results');
    }
  } catch (err) {
    console.error('❌ get_popular_searches exception:', err.message);
  }

  console.log('');

  // Test 3: get_search_suggestions function
  console.log('3️⃣ Testing get_search_suggestions function...');
  try {
    const { data, error } = await supabase.rpc('get_search_suggestions', {
      partial_query: 'prog',
      suggestion_limit: 5
    });

    if (error) {
      console.error('❌ get_search_suggestions error:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('✅ get_search_suggestions working! Returned', data?.length || 0, 'results');
    }
  } catch (err) {
    console.error('❌ get_search_suggestions exception:', err.message);
  }

  console.log('');

  // Test 4: Check if bundle_only column exists
  console.log('4️⃣ Testing books table structure...');
  try {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, bundle_only')
      .limit(1);

    if (error) {
      console.error('❌ books table error:', error.message);
      if (error.message.includes('bundle_only')) {
        console.log('   💡 The bundle_only column might not exist. Run the migration script.');
      }
    } else {
      console.log('✅ books table accessible with bundle_only column');
    }
  } catch (err) {
    console.error('❌ books table exception:', err.message);
  }

  console.log('\n🏁 Test complete!');
  console.log('\n📋 Next steps if there are errors:');
  console.log('1. Follow the guide in SUPABASE_RPC_FIX_GUIDE.md');
  console.log('2. Run fix_rpc_functions.sql in your Supabase SQL editor');
  console.log('3. Ensure all migrations have been applied');
  console.log('4. Check that RLS policies allow function access');
  console.log('\n💡 Quick fix: Copy the content of fix_rpc_functions.sql and paste it into your Supabase SQL editor, then click Run.');
}

// Run the test
testRPCFunctions().catch(console.error);
