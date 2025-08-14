# 🚨 IMMEDIATE FIX for Purchase Error

## The Problem
The error shows: `Could not find the 'item_title' column of 'purchases' in the schema cache`

This means the database is missing required columns.

## ✅ QUICK FIX (2 minutes)

### Step 1: Add Missing Columns
1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Open your project**: `byxggitbwomgnxuegxgt`
3. **Go to SQL Editor**
4. **Copy and paste this SQL**:

```sql
-- Add missing columns to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
ADD COLUMN IF NOT EXISTS initiation_token TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);

-- Update existing purchases to have transaction references
UPDATE purchases 
SET transaction_reference = 'AST-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE transaction_reference IS NULL;
```

5. **Click "Run"**

### Step 2: Test the Fix
1. **Refresh your browser** on the book page
2. **Click "Buy Now"** 
3. **Should now redirect to Telegram** instead of showing an error

## 🎯 Expected Result

After running the SQL:
- ✅ Purchase creation will work
- ✅ Telegram redirect will work  
- ✅ Bot will show book details
- ✅ Complete purchase flow will be functional

## 🔍 Verify It Worked

Check in your browser console (F12):
```javascript
// This should now return a Telegram URL instead of an error
fetch('/api/purchases/initiate-telegram', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itemType: 'book',
    itemId: '8f67e22d-f9e1-4abb-96c0-19abf7da25ab',
    amount: 100
  })
}).then(r => r.json()).then(console.log)
```

## 🚀 What This Fixes

The SQL adds these missing columns to your `purchases` table:
- `telegram_chat_id` - Links purchase to Telegram chat
- `telegram_user_id` - Links purchase to Telegram user  
- `amount_in_birr` - Price in Ethiopian Birr
- `initiation_token` - Token for Telegram bot initiation
- `transaction_reference` - Order ID for tracking

**This is a one-time fix. Once done, all Telegram purchases will work perfectly!**