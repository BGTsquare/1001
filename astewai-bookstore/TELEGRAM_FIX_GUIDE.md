# Telegram Purchase Flow - Fix Guide

## 🚨 Current Issue
You're getting "Internal server error" when trying to purchase books. This is likely because the database doesn't have the required Telegram columns yet.

## 🔧 Quick Fix Steps

### Step 1: Add Database Columns
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the content from `add-telegram-columns.sql`
4. Click **Run**

This will add the required columns:
- `telegram_chat_id`
- `telegram_user_id` 
- `amount_in_birr`
- `initiation_token`

### Step 2: Test the Fix
1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Go to any book page: `http://localhost:3001/books/[book-id]`

3. Click **"Buy Now"** - it should now redirect to Telegram instead of showing an error

### Step 3: Complete Telegram Setup (Optional)
If you want the full Telegram bot functionality:

1. **Set Webhook URL** (for production):
   ```bash
   curl -X POST "https://api.telegram.org/bot8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
   ```

2. **For local testing with ngrok**:
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

## 🧪 Testing

### Test 1: Basic Purchase Flow
1. Go to a book page
2. Click "Buy Now"
3. Should redirect to Telegram bot
4. Bot should show book details and payment instructions

### Test 2: API Endpoint
Run this in your browser console on the book page:
```javascript
fetch('/api/purchases/initiate-telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemType: 'book',
    itemId: 'your-book-id',
    amount: 100
  })
}).then(r => r.json()).then(console.log)
```

Should return a Telegram URL instead of an error.

## 🔍 Troubleshooting

### Still Getting Internal Server Error?
1. Check your browser's Network tab for the exact error
2. Check your server logs in the terminal
3. Verify the database columns were added correctly

### Telegram Bot Not Responding?
1. Make sure webhook URL is set correctly
2. Check that your bot token is valid
3. Verify the bot username in environment variables

### Purchase Redirects to Wrong Bot?
Check your `TELEGRAM_BOT_USERNAME` in `.env.local` - it should be `astewaibot` (without @)

## 📋 Current Configuration

Your environment is set up with:
- **Bot Token**: `8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98`
- **Bot Username**: `astewaibot`
- **Admin Channel**: `-1002507103914`

## ✅ Expected Flow After Fix

1. **User clicks "Buy Now"** → Creates purchase record with Telegram token
2. **Redirects to Telegram** → `https://t.me/astewaibot?start=tg_123456_abcdef`
3. **Bot shows book details** → Title, price in ETB, payment instructions
4. **User sends payment screenshot** → Bot forwards to admin channel
5. **Admin approves** → `/approve AST-123456-ABCD`
6. **User gets reading link** → Secure access to the book

The main fix is just adding the database columns. Everything else should work automatically!