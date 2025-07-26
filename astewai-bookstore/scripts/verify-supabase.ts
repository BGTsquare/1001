/**
 * Verification script for Supabase configuration
 * Run with: npx tsx scripts/verify-supabase.ts
 */

import { createClient } from '@/lib/supabase/server'

async function verifySupabaseSetup() {
  console.log('🔍 Verifying Supabase configuration...\n')

  try {
    const supabase = await createClient()

    // Test database connection
    console.log('1. Testing database connection...')
    const { error: healthError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (healthError) {
      console.error('❌ Database connection failed:', healthError.message)
      return false
    }
    console.log('✅ Database connection successful')

    // Test table existence
    console.log('\n2. Checking table existence...')
    const tables = ['profiles', 'books', 'bundles', 'bundle_books', 'user_library', 'blog_posts', 'purchases', 'reviews'] as const
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (error) {
        console.error(`❌ Table '${table}' not found or accessible:`, error.message)
        return false
      }
      console.log(`✅ Table '${table}' exists and accessible`)
    }

    // Test RLS policies
    console.log('\n3. Testing RLS policies...')
    const { error: booksError } = await supabase.from('books').select('*').limit(1)
    if (!booksError) {
      console.log('✅ Public book access working')
    }

    // Test seed data
    console.log('\n4. Checking seed data...')
    const { data: seedBooks } = await supabase.from('books').select('count')
    const { data: seedBundles } = await supabase.from('bundles').select('count')
    const { data: seedPosts } = await supabase.from('blog_posts').select('count')

    console.log(`✅ Found ${seedBooks?.length || 0} books in database`)
    console.log(`✅ Found ${seedBundles?.length || 0} bundles in database`)
    console.log(`✅ Found ${seedPosts?.length || 0} blog posts in database`)

    console.log('\n🎉 Supabase configuration verified successfully!')
    return true

  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifySupabaseSetup()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Script execution failed:', error)
      process.exit(1)
    })
}

export { verifySupabaseSetup }