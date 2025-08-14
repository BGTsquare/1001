#!/usr/bin/env node

/**
 * Test script for Telegram webhook
 * Usage: node scripts/test-telegram-webhook.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Sample Telegram update for testing
const sampleUpdates = {
  start: {
    update_id: 123456,
    message: {
      message_id: 1,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "testuser"
      },
      chat: {
        id: 123456789,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start test-token-123"
    }
  },
  help: {
    update_id: 123457,
    message: {
      message_id: 2,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "testuser"
      },
      chat: {
        id: 123456789,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/help"
    }
  },
  orderStatus: {
    update_id: 123458,
    message: {
      message_id: 3,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "testuser"
      },
      chat: {
        id: 123456789,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/orderstatus AST-12345-ABCD"
    }
  },
  paymentConfirmation: {
    update_id: 123459,
    message: {
      message_id: 4,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "testuser"
      },
      chat: {
        id: 123456789,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "I have paid for the book"
    }
  }
}

async function testWebhook(updateType) {
  const update = sampleUpdates[updateType]
  if (!update) {
    console.error(`Unknown update type: ${updateType}`)
    console.log('Available types:', Object.keys(sampleUpdates).join(', '))
    return
  }

  console.log(`Testing ${updateType} update...`)
  console.log('Sending:', JSON.stringify(update, null, 2))

  try {
    const response = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update)
    })

    console.log('Response status:', response.status)
    const responseText = await response.text()
    console.log('Response body:', responseText)

    if (response.ok) {
      console.log('✅ Test passed')
    } else {
      console.log('❌ Test failed')
    }
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Run tests
async function runTests() {
  const testType = process.argv[2] || 'help'
  
  console.log('🤖 Testing Telegram Webhook')
  console.log('Base URL:', BASE_URL)
  console.log('Test type:', testType)
  console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Missing')
  console.log('Bot Username:', process.env.TELEGRAM_BOT_USERNAME ? 'Set' : 'Missing')
  console.log('Admin Channel:', process.env.TELEGRAM_ADMIN_CHANNEL_ID ? 'Set' : 'Missing')
  console.log('---')

  if (testType === 'all') {
    for (const type of Object.keys(sampleUpdates)) {
      await testWebhook(type)
      console.log('---')
    }
  } else {
    await testWebhook(testType)
  }
}

runTests().catch(console.error)