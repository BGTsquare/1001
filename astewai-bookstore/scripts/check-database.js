#!/usr/bin/env node

/**
 * Check if the database has the required Telegram columns
 * Usage: node scripts/check-database.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check if purchases table has Telegram columns
    console.log('\n📋 Checking purchases table columns...')
    
    const { data, error } = await supabase
      .from('purchases')
      .select('telegram_chat_id, telegram_user_id, amount_in_birr, initiation_token')
      .limit(1)
    
    if (error) {
      console.log('❌ Telegram columns missing in purchases table')
      console.log('Error:', error.message)
      console.log('\n💡 Solution: Run the database migration')
      console.log('   1. Go to your Supabase Dashboard')
      console.log('   2. Open SQL Editor')
      console.log('   3. Run the content from telegram_migration.sql')
    } else {
      console.log('✅ Telegram columns exist in purchases table')
    }

    // Check if new tables exist
    console.log('\n📋 Checking new tables...')
    
    const tables = ['purchase_screenshots', 'reading_tokens', 'admin_settings']
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('id')
          .limit(1)
        
        if (tableError) {
          console.log(`❌ Table '${table}' does not exist`)
        } else {
          console.log(`✅ Table '${table}' exists`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}' does not exist`)
      }
    }

    // Check environment variables
    console.log('\n🔧 Checking environment variables...')
    console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing')
    console.log('TELEGRAM_BOT_USERNAME:', process.env.TELEGRAM_BOT_USERNAME ? '✅ Set' : '❌ Missing')
    console.log('TELEGRAM_ADMIN_CHANNEL_ID:', process.env.TELEGRAM_ADMIN_CHANNEL_ID ? '✅ Set' : '❌ Missing')

    // Test a simple purchase creation (without Telegram fields)
    console.log('\n🧪 Testing basic purchase creation...')
    
    try {
      const testPurchase = {
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        item_type: 'book',
        item_id: '00000000-0000-0000-0000-000000000000',
        item_title: 'Test Book',
        amount: 100,
        transaction_reference: `TEST-${Date.now()}`,
        status: 'pending_initiation',
        created_at: new Date().toISOString()
      }

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(testPurchase)
        .select()
        .single()

      if (purchaseError) {
        console.log('❌ Basic purchase creation failed:', purchaseError.message)
      } else {
        console.log('✅ Basic purchase creation works')
        
        // Clean up test purchase
        await supabase
          .from('purchases')
          .delete()
          .eq('id', purchase.id)
      }
    } catch (err) {
      console.log('❌ Purchase creation test failed:', err.message)
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

checkDatabase().catch(console.error)