// Quick test to check if database columns exist
// Run this in browser console on any page of your app

async function testDatabaseColumns() {
  try {
    console.log('🔍 Testing database columns...')
    
    // Test the purchase API to see what happens
    const response = await fetch('/api/purchases/initiate-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: 'book',
        itemId: '8f67e22d-f9e1-4abb-96c0-19abf7da25ab',
        amount: 100
      })
    })

    const result = await response.text()
    console.log('Response status:', response.status)
    console.log('Response:', result)

    if (response.status === 401) {
      console.log('✅ API is working (needs authentication)')
    } else if (response.status === 500 && result.includes('item_title')) {
      console.log('❌ Database missing columns - run the SQL migration!')
      console.log('📋 Go to Supabase Dashboard → SQL Editor → Run add-telegram-columns.sql')
    } else if (response.status === 200) {
      console.log('✅ Purchase API working correctly')
    } else {
      console.log('❓ Unexpected response')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabaseColumns()