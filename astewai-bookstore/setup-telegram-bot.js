// Setup script for Telegram bot webhook
// Run with: node setup-telegram-bot.js

const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // Replace with your actual bot token
const WEBHOOK_URL = 'https://your-domain.com/api/telegram/webhook'; // Replace with your actual domain

async function setupWebhook() {
  try {
    console.log('Setting up Telegram bot webhook...');
    
    // Set webhook
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message']
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('Webhook URL:', WEBHOOK_URL);
    } else {
      console.error('❌ Failed to set webhook:', result);
    }

    // Get webhook info
    const infoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const info = await infoResponse.json();
    
    console.log('\n📋 Current webhook info:');
    console.log(JSON.stringify(info.result, null, 2));

  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

async function testBot() {
  try {
    console.log('\n🤖 Testing bot...');
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Bot is working!');
      console.log('Bot info:', result.result);
    } else {
      console.error('❌ Bot test failed:', result);
    }
  } catch (error) {
    console.error('Error testing bot:', error);
  }
}

// Run setup
async function main() {
  console.log('🚀 Telegram Bot Setup\n');
  
  if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ Please update TELEGRAM_BOT_TOKEN in this script with your actual bot token');
    return;
  }
  
  if (WEBHOOK_URL.includes('your-domain.com')) {
    console.error('❌ Please update WEBHOOK_URL in this script with your actual domain');
    return;
  }
  
  await testBot();
  await setupWebhook();
  
  console.log('\n✅ Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your .env.local with the correct TELEGRAM_BOT_TOKEN');
  console.log('2. Deploy your application to make the webhook accessible');
  console.log('3. Test the purchase flow by buying a book');
}

main();