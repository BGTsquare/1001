#!/usr/bin/env node

/**
 * Setup script for new Supabase project
 * This script helps validate the new Supabase connection
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function validateSupabaseConnection() {
  console.log('🔍 Validating Supabase connection...\n');

  // Check environment variables
  if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.log('Please check your .env.local file and ensure you have:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  // Test connection with anon key
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase.from('books').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      
      if (error.message.includes('relation "books" does not exist')) {
        console.log('\n💡 It looks like the database schema hasn\'t been set up yet.');
        console.log('Please run the SQL migrations in your Supabase dashboard:');
        console.log('1. Go to SQL Editor in your Supabase dashboard');
        console.log('2. Run the contents of supabase/migrations/000_complete_schema.sql');
        console.log('3. Run the contents of supabase/migrations/001_storage_setup.sql');
        console.log('4. Optionally run supabase/seed_updated.sql for sample data');
      }
      
      process.exit(1);
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Books table exists with ${data || 0} records`);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }

  // Test service role key
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    const { data: profiles, error: profileError } = await adminSupabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profileError) {
      console.error('❌ Service role key test failed:', profileError.message);
      process.exit(1);
    }

    console.log('✅ Service role key working');
    console.log(`👥 Profiles table exists with ${profiles || 0} records`);

  } catch (err) {
    console.error('❌ Service role key error:', err.message);
    process.exit(1);
  }

  // Check for admin users
  try {
    const { data: admins, error: adminError } = await adminSupabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('role', 'admin');
    
    if (adminError) {
      console.warn('⚠️  Could not check for admin users:', adminError.message);
    } else if (admins && admins.length > 0) {
      console.log('✅ Admin users found:');
      admins.forEach(admin => {
        console.log(`   - ${admin.display_name || 'Unnamed'} (${admin.id})`);
      });
    } else {
      console.log('⚠️  No admin users found');
      console.log('💡 After signing up, you can make a user admin with:');
      console.log('   pnpm admin:make your-email@example.com');
    }
  } catch (err) {
    console.warn('⚠️  Could not check admin users:', err.message);
  }

  console.log('\n🎉 Supabase setup validation complete!');
  console.log('\nNext steps:');
  console.log('1. Start your development server: pnpm dev');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Sign up for an account');
  console.log('4. Make yourself an admin if needed');
  console.log('5. Test the application features');
}

// Check if this is being run directly
if (require.main === module) {
  validateSupabaseConnection().catch(console.error);
}

module.exports = { validateSupabaseConnection };