/**
 * Script to promote a user to admin role
 * Usage: node scripts/make-admin.js <email>
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeAdmin(email) {
  if (!email) {
    console.error('Please provide an email address')
    console.error('Usage: node scripts/make-admin.js <email>')
    process.exit(1)
  }

  try {
    // First, find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError.message)
      process.exit(1)
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`User with email ${email} not found`)
      console.log('Available users:')
      users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
      process.exit(1)
    }

    // Update the user's profile to admin role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('Error updating user role:', error.message)
      process.exit(1)
    }

    console.log(`✅ Successfully promoted ${email} to admin role`)
    console.log('User details:', {
      id: user.id,
      email: user.email,
      role: 'admin'
    })
    
    console.log('\n🎉 You can now access the admin dashboard at http://localhost:3000/admin')
    
  } catch (error) {
    console.error('Unexpected error:', error.message)
    process.exit(1)
  }
}

// Get email from command line arguments
const email = process.argv[2]
makeAdmin(email)