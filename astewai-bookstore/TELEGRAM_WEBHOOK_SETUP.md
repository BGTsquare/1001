# 🤖 Telegram Bot Webhook Setup

## 🚨 Current Issue
Your bot redirects to Telegram but doesn't respond because:
1. **No webhook is set** - Telegram doesn't know where to send messages
2. **Database migration needed** - Bot can't find purchase information

## ✅ QUICK FIX (5 minutes)

### Step 1: Set Up Webhook (Choose One Option)

#### Option A: For Local Testing (Recommended)
1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   ```

2. **Expose your local server**:
   ```bash
   ngrok http 3001
   ```
   
3. **Copy the HTTPS URL** (something like `https://abc123.ngrok.io`)

4. **Set the webhook**:
   ```bash
   curl -X POST "https://api.telegram.org/bot8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://YOUR-NGROK-URL.ngrok.io/api/telegram/webhook"}'
   ```

#### Option B: For Production
If you have a live domain:
```bash
curl -X POST "https://api.telegram.org/bot8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

### Step 2: Run Database Migration
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Open SQL Editor**
3. **Run this SQL**:
   ```sql
   -- Add missing columns for Telegram integration
   ALTER TABLE purchases 
   ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
   ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
   ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
   ADD COLUMN IF NOT EXISTS initiation_token TEXT,
   ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
   ```

### Step 3: Test the Bot
1. **Go back to your book page**
2. **Click "Buy Now"** - should redirect to Telegram
3. **Send `/start` with the token** - bot should now respond with book details!

## 🔍 Verify Webhook is Set

Check if webhook is working:
```bash
curl "https://api.telegram.org/bot8335910103:AAH58iU_WNNilHYYjalE-qYbo134WjF-r98/getWebhookInfo"
```

Should return:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-ngrok-url.ngrok.io/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 🎯 Expected Flow After Setup

1. **Click "Buy Now"** → Redirects to Telegram with token
2. **Bot responds immediately** with:
   ```
   📚 New Book
   💵 Price: 0 Birr

   💳 Payment Instructions:
   Please send payment to one of these accounts:
   
   1. Commercial Bank of Ethiopia
      Account: [Your Account Number]
      Name: Astewai Bookstore
   
   Order ID: AST-123456-ABCD
   
   📱 After payment, send a screenshot here or type "PAID"
   ```

## 🚨 Troubleshooting

### Bot Still Not Responding?
1. Check webhook URL is accessible: `curl https://your-ngrok-url.ngrok.io/api/telegram/webhook`
2. Check server logs for webhook requests
3. Verify bot token is correct

### No Book Information?
1. Make sure you ran the database migration
2. Check server logs for "Looking up purchase with token"
3. Verify the purchase was created successfully

**Once both steps are done, your Telegram bot will work perfectly!**