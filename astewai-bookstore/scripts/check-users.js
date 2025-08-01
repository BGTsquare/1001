/**
 * Script to check current users and their roles
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

async function checkUsers() {
  try {
    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error listing auth users:', authError.message)
      process.exit(1)
    }

    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')

    if (profileError) {
      console.error('Error fetching profiles:', profileError.message)
      process.exit(1)
    }

    console.log('📊 Current Users and Roles:')
    console.log('=' .repeat(50))

    if (authUsers.users.length === 0) {
      console.log('No users found. Please register a user first.')
      return
    }

    authUsers.users.forEach(user => {
      const profile = profiles?.find(p => p.id === user.id)
      console.log(`👤 ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Role: ${profile?.role || 'No profile'}`)
      console.log(`   Display Name: ${profile?.display_name || 'Not set'}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`)
      console.log('')
    })

    const adminUsers = profiles?.filter(p => p.role === 'admin') || []
    console.log(`🔑 Admin users: ${adminUsers.length}`)
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  No admin users found!')
      console.log('To make a user admin, run:')
      console.log('node scripts/make-admin.js <email>')
    }

  } catch (error) {
    console.error('Unexpected error:', error.message)
    process.exit(1)
  }
}

checkUsers()