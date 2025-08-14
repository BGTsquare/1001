# Quick Telegram Setup Guide

## ✅ Environment Variables Fixed

Your `.env.local` file has been updated with the correct Telegram configuration:

```bash
TELEGRAM_BOT_TOKEN=8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98
TELEGRAM_BOT_USERNAME=astewaibot
TELEGRAM_ADMIN_CHANNEL_ID=-1002507103914
```

## 🗄️ Database Migration Required

**Option 1: Manual SQL (Recommended)**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `telegram_migration.sql`
4. Run the script

**Option 2: CLI Migration (if you have Docker)**
```bash
supabase db push --include-all
```

## 🤖 Bot Setup Steps

### 1. Set Webhook URL
```bash
curl -X POST "https://api.telegram.org/bot8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

For local development with ngrok:
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3001

# Set webhook with ngrok URL
curl -X POST "https://api.telegram.org/bot8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.io/api/telegram/webhook"}'
```

### 2. Test the Bot
```bash
# Test webhook locally
node scripts/test-telegram-webhook.js help

# Test all commands
node scripts/test-telegram-webhook.js all
```

## 🔧 Admin Interface

Access the Telegram admin panel at: `http://localhost:3001/admin/telegram`

Here you can:
- Configure bot messages
- Monitor purchases
- Check bot status

## 🚀 Testing the Complete Flow

1. **Start your development server**:
   ```bash
   pnpm dev
   ```

2. **Go to any book page**: `http://localhost:3001/books/[book-id]`

3. **Click "Buy Now"** - Should redirect to Telegram bot

4. **In Telegram**: Bot should show book details and payment instructions

5. **Send payment screenshot** or type "PAID"

6. **Admin approval**: Use `/approve [OrderID]` in your admin channel

7. **User gets secure reading link**

## 📱 Bot Commands

### User Commands
- `/help` - Show payment instructions
- `/orderstatus [OrderID]` - Check order status

### Admin Commands (Admin Channel Only)
- `/approve [OrderID]` - Approve purchase
- `/reject [OrderID]` - Reject purchase

## 🔍 Troubleshooting

### Bot Not Responding
- Check webhook URL is set correctly
- Verify bot token is valid
- Ensure webhook endpoint is accessible

### Purchase Flow Issues
- Run database migration first
- Check environment variables
- Test with the provided test script

### Admin Commands Not Working
- Verify admin channel ID is correct (negative number)
- Ensure bot is admin in the channel
- Check bot has necessary permissions

## 📋 Current Status

✅ Environment variables configured  
✅ Code implementation complete  
✅ Webhook endpoint working  
⏳ Database migration needed  
⏳ Webhook URL setup needed  

## Next Steps

1. Run the database migration (use `telegram_migration.sql`)
2. Set up the webhook URL
3. Test the complete purchase flow
4. Configure payment instructions in admin panel

The Telegram purchase flow is ready to use once you complete the database migration and webhook setup!