#!/usr/bin/env node

/**
 * Test Production Connectivity
 * Tests specific network requests that might be failing in production
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing Production Connectivity for Astewai Digital Bookstore');
console.log('🌐 Production URL: https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app');
console.log('');

async function testConnectivity() {
  console.log('📋 Environment Check:');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Key Present: ${!!supabaseKey}`);
  console.log('');

  // Test 1: Basic Supabase Connection
  console.log('1️⃣ Testing basic Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log(`❌ Profiles table error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
    } else {
      console.log('✅ Basic connection working');
    }
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`);
  }

  // Test 2: Authentication System
  console.log('');
  console.log('2️⃣ Testing authentication system...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log(`❌ Auth error: ${error.message}`);
    } else {
      console.log('✅ Auth system accessible');
      console.log(`   Session: ${data.session ? 'Active' : 'None'}`);
    }
  } catch (err) {
    console.log(`❌ Auth system failed: ${err.message}`);
  }

  // Test 3: Critical Tables
  console.log('');
  console.log('3️⃣ Testing critical database tables...');
  
  const tables = ['profiles', 'books', 'bundles', 'user_library', 'purchases', 'blog_posts'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ ${table}: Accessible (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Test 4: Storage Buckets
  console.log('');
  console.log('4️⃣ Testing storage buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log(`❌ Storage error: ${error.message}`);
    } else {
      console.log(`✅ Storage accessible (${buckets?.length || 0} buckets)`);
      const requiredBuckets = ['book-covers', 'book-content', 'blog-images', 'avatars', 'payment-confirmations'];
      
      requiredBuckets.forEach(bucketName => {
        const bucket = buckets?.find(b => b.name === bucketName);
        if (bucket) {
          console.log(`   ✅ ${bucketName}: Found (Public: ${bucket.public})`);
        } else {
          console.log(`   ❌ ${bucketName}: Missing`);
        }
      });
    }
  } catch (err) {
    console.log(`❌ Storage failed: ${err.message}`);
  }

  // Test 5: RPC Functions
  console.log('');
  console.log('5️⃣ Testing RPC functions...');
  
  const rpcFunctions = [
    { name: 'search_books', params: { search_query: 'test', limit_count: 5 } },
    { name: 'get_popular_searches', params: { limit_count: 5, time_period: '7 days' } },
    { name: 'get_search_suggestions', params: { search_query: 'test', limit_count: 5 } }
  ];

  for (const func of rpcFunctions) {
    try {
      const { data, error } = await supabase.rpc(func.name, func.params);
      if (error) {
        console.log(`❌ ${func.name}: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ ${func.name}: Working (${data?.length || 0} results)`);
      }
    } catch (err) {
      console.log(`❌ ${func.name}: ${err.message}`);
    }
  }

  // Test 6: Production API Endpoints
  console.log('');
  console.log('6️⃣ Testing production API endpoints...');
  
  const baseUrl = 'https://astewai-bookstore-84cc1ea5f-getachewbinyam5-gmailcoms-projects.vercel.app';
  const endpoints = [
    '/api/test/supabase',
    '/api/books',
    '/api/bundles',
    '/api/blog'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.log(`❌ ${endpoint}: ${err.message}`);
    }
  }

  console.log('');
  console.log('🔧 DIAGNOSIS SUMMARY:');
  console.log('====================');
  console.log('If you see missing tables or RPC function errors, you need to:');
  console.log('1. Apply FRESH_SUPABASE_MIGRATION.sql to your Supabase project');
  console.log('2. Configure authentication settings in Supabase Dashboard');
  console.log('3. Update Vercel environment variables if needed');
  console.log('');
  console.log('📖 Follow the complete setup guide in FRESH_SUPABASE_SETUP_GUIDE.md');
}

testConnectivity().catch(console.error);
