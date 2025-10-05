const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function diagnoseProductionIssues() {
  console.log('🔍 Diagnosing Production Issues for Astewai Digital Bookstore\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📋 Environment Configuration:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   NEXT_PUBLIC_SITE_URL: ${siteUrl}`);
  console.log(`   Supabase Key Present: ${!!supabaseKey}`);
  console.log('');

  // Issue 1: Email Confirmation Diagnosis
  console.log('📧 ISSUE 1: Email Confirmation Diagnosis');
  console.log('=' .repeat(50));

  try {
    // Test auth configuration
    const { data: authConfig, error: configError } = await supabase.auth.getSession();
    
    if (configError) {
      console.log('❌ Auth Configuration Error:', configError.message);
    } else {
      console.log('✅ Supabase Auth Connection: Working');
    }

    // Check if email confirmations are enabled (this will show in the error if not configured)
    console.log('\n📝 Email Confirmation Settings Check:');
    console.log('   Expected Confirmation URL: https://astewai-bookstore.vercel.app/auth/confirm');
    console.log('   Expected Reset URL: https://astewai-bookstore.vercel.app/auth/reset-password');
    console.log('   Expected Site URL: https://astewai-bookstore.vercel.app');
    
    // Test user lookup (to see if users exist but are unconfirmed)
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(5);

    if (userError) {
      console.log('❌ Profile Access Error:', userError.message);
    } else {
      console.log(`✅ Profile Table Access: Working (${users?.length || 0} profiles found)`);
    }

  } catch (error) {
    console.log('❌ Auth Diagnosis Error:', error.message);
  }

  console.log('\n🖼️  ISSUE 2: Book Cover Image Diagnosis');
  console.log('=' .repeat(50));

  try {
    // Test storage bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage Bucket Access Error:', bucketError.message);
    } else {
      console.log('✅ Storage Buckets Access: Working');
      const bookCoversBucket = buckets.find(b => b.name === 'book-covers');
      if (bookCoversBucket) {
        console.log('✅ book-covers bucket: Found');
        console.log(`   Public: ${bookCoversBucket.public}`);
      } else {
        console.log('❌ book-covers bucket: Not found');
      }
    }

    // Test book data and cover URLs
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, cover_image_url')
      .limit(5);

    if (booksError) {
      console.log('❌ Books Table Access Error:', booksError.message);
    } else {
      console.log(`✅ Books Table Access: Working (${books?.length || 0} books found)`);
      
      if (books && books.length > 0) {
        console.log('\n📚 Sample Book Cover URLs:');
        books.forEach((book, index) => {
          console.log(`   ${index + 1}. ${book.title}`);
          if (book.cover_image_url) {
            console.log(`      Cover URL: ${book.cover_image_url}`);
            // Check if URL is properly formatted
            if (book.cover_image_url.includes('supabase.co')) {
              console.log('      ✅ Supabase storage URL format');
            } else {
              console.log('      ⚠️  Non-Supabase URL format');
            }
          } else {
            console.log('      ❌ No cover image URL');
          }
        });
      }
    }

    // Test storage file listing
    const { data: files, error: filesError } = await supabase.storage
      .from('book-covers')
      .list('', { limit: 5 });

    if (filesError) {
      console.log('❌ Storage Files Access Error:', filesError.message);
    } else {
      console.log(`✅ Storage Files Access: Working (${files?.length || 0} files found)`);
      if (files && files.length > 0) {
        console.log('\n📁 Sample Storage Files:');
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Storage Diagnosis Error:', error.message);
  }

  console.log('\n🔧 RECOMMENDED ACTIONS:');
  console.log('=' .repeat(50));

  console.log('\n📧 For Email Confirmation Issues:');
  console.log('1. Check Supabase Dashboard → Authentication → Settings');
  console.log('   - Site URL should be: https://astewai-bookstore.vercel.app');
  console.log('   - Email confirmations should be enabled');
  console.log('2. Check Supabase Dashboard → Authentication → URL Configuration');
  console.log('   - Add redirect URLs for /auth/callback, /auth/confirm');
  console.log('3. Check Vercel Environment Variables');
  console.log('   - NEXT_PUBLIC_SITE_URL should match production domain');

  console.log('\n🖼️  For Book Cover Image Issues:');
  console.log('1. Check Supabase Dashboard → Storage');
  console.log('   - Ensure book-covers bucket exists and is public');
  console.log('2. Check Storage Policies');
  console.log('   - Ensure public read access for book-covers bucket');
  console.log('3. Check Next.js Image Configuration');
  console.log('   - Verify Supabase domain is in remotePatterns');
  console.log('4. Check CSP Headers');
  console.log('   - Ensure img-src allows Supabase storage domain');

  console.log('\n🚀 Quick Fixes to Try:');
  console.log('1. Run: node scripts/test-rpc-functions.js');
  console.log('2. Apply RPC fixes: Copy fix_rpc_functions.sql to Supabase SQL Editor');
  console.log('3. Check browser Network tab for failed image requests');
  console.log('4. Test email confirmation with a new registration');
}

// Run the diagnosis
diagnoseProductionIssues().catch(console.error);
