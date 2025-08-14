#!/usr/bin/env node

/**
 * Test the purchase API endpoint
 * Usage: node scripts/test-purchase-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

async function testPurchaseAPI() {
  console.log('🧪 Testing Purchase API')
  console.log('Base URL:', BASE_URL)
  console.log('---')

  try {
    // Test data - you'll need to replace with actual book ID from your database
    const testData = {
      itemType: 'book',
      itemId: '8f67e22d-f9e1-4abb-96c0-19abf7da25ab', // Replace with actual book ID
      amount: 100
    }

    console.log('Testing purchase initiation...')
    console.log('Request data:', JSON.stringify(testData, null, 2))

    const response = await fetch(`${BASE_URL}/api/purchases/initiate-telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without authentication, but we can see the error
      },
      body: JSON.stringify(testData)
    })

    console.log('Response status:', response.status)
    const responseText = await response.text()
    console.log('Response body:', responseText)

    if (response.status === 401) {
      console.log('✅ API endpoint is working (authentication required as expected)')
    } else if (response.status === 500) {
      console.log('❌ Internal server error - likely database issue')
    } else {
      console.log('✅ API endpoint responded')
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testPurchaseAPI().catch(console.error)