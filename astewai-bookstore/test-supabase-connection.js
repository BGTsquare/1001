#!/usr/bin/env node

/**
 * Simple test to verify Supabase connection works
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Supabase Connection...\n');
console.log('📍 URL:', url);
console.log('🔑 Key:', key ? 'Present ✅' : 'Missing ❌');

if (!url || !key) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  try {
    console.log('\n🔍 Testing basic connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('books')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database query failed:', error.message);
      return false;
    }
    
    console.log('✅ Database query successful');
    console.log('📊 Books table has', data || 0, 'records');
    
    // Test 2: Auth endpoint
    console.log('\n🔍 Testing auth endpoint...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth endpoint failed:', authError.message);
      return false;
    }
    
    console.log('✅ Auth endpoint working');
    console.log('👤 Current session:', authData.session ? 'Active' : 'None');
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! Supabase connection is working.');
    console.log('\n💡 If you\'re still getting "Failed to fetch" in the browser:');
    console.log('1. Clear your browser cache and cookies for localhost');
    console.log('2. Try opening in an incognito/private window');
    console.log('3. Check browser console for CORS or network errors');
    console.log('4. Make sure you\'re accessing the correct port');
  } else {
    console.log('\n❌ Tests failed. Check your Supabase configuration.');
  }
  process.exit(success ? 0 : 1);
});