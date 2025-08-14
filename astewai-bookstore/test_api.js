// Simple test script to verify API endpoints
// Run with: node test_api.js

const BASE_URL = 'http://localhost:3001';

async function testContactAPI() {
  try {
    console.log('Testing /api/contact endpoint...');
    const response = await fetch(`${BASE_URL}/api/contact`);
    const data = await response.json();
    console.log('Contact API Response:', data);
  } catch (error) {
    console.error('Contact API Error:', error.message);
  }
}

async function testPaymentConfigAPI() {
  try {
    console.log('Testing payment config...');
    // This would need to be implemented
    console.log('Payment config API not yet implemented');
  } catch (error) {
    console.error('Payment Config Error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testContactAPI();
  await testPaymentConfigAPI();
}

if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests();
}