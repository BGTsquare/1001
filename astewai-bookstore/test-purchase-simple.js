// Simple test to check if purchase creation works
// Run this after starting your dev server: pnpm dev

const testPurchase = async () => {
  try {
    console.log('Testing purchase API...')
    
    const response = await fetch('http://localhost:3001/api/purchases/initiate-telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        itemType: 'book',
        itemId: '8f67e22d-f9e1-4abb-96c0-19abf7da25ab',
        amount: 100
      })
    })

    console.log('Status:', response.status)
    const result = await response.text()
    console.log('Response:', result)

    if (response.status === 401) {
      console.log('✅ API is working (needs authentication)')
    } else if (response.status === 500) {
      console.log('❌ Server error - check logs')
    } else {
      console.log('✅ API responded')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testPurchase()