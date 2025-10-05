/**
 * Creates a default admin user (if not exists) and promotes them to admin role.
 * Usage: node scripts/create-default-admin.js
 * Requires .env.local to contain SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL || 'biniyam1881@gmail.com'
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!'

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function createOrPromoteAdmin() {
  try {
    // Try to find existing user by email
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) throw listErr

    const existing = list.users.find(u => u.email && u.email.toLowerCase() === adminEmail.toLowerCase())

    let userId
    if (existing) {
      userId = existing.id
      console.log('Found existing user:', adminEmail, userId)
    } else {
      // Create a new user (service role required)
      const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      })
      if (createErr) throw createErr
      userId = createdUser.user.id
      console.log('Created new user:', adminEmail, userId)
    }

    // Upsert into profiles with role 'admin'
    const { data: profile, error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'admin', display_name: adminEmail.split('@')[0] }, { returning: 'minimal' })

    if (upsertErr) throw upsertErr

    console.log(`✅ Admin user ready: ${adminEmail} (id: ${userId}).`)
    console.log('Make sure to change the default password and secure SUPABASE_SERVICE_ROLE_KEY.')
  } catch (err) {
    console.error('Error creating/promoting admin:', err.message || err)
    process.exit(1)
  }
}

createOrPromoteAdmin()
