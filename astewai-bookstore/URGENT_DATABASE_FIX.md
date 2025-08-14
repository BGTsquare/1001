# 🚨 URGENT: Database Migration Required

## The Issue
You're still getting this error:
```
Could not find the 'item_title' column of 'purchases' in the schema cache
```

This means **you haven't run the database migration yet**.

## ✅ IMMEDIATE FIX (2 minutes)

### Step 1: Run Database Migration
1. **Open your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `byxggitbwomgnxuegxgt`
3. **Go to SQL Editor** (left sidebar)
4. **Copy this SQL and run it**:

```sql
-- Add missing columns to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT,
ADD COLUMN IF NOT EXISTS amount_in_birr INTEGER,
ADD COLUMN IF NOT EXISTS initiation_token TEXT,
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_telegram_chat_id ON purchases(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_purchases_initiation_token ON purchases(initiation_token);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_reference ON purchases(transaction_reference);

-- Update existing purchases to have transaction references
UPDATE purchases 
SET transaction_reference = 'AST-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
WHERE transaction_reference IS NULL;

-- Verify columns were added (should show 5 rows)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND column_name IN ('telegram_chat_id', 'telegram_user_id', 'amount_in_birr', 'initiation_token', 'transaction_reference')
ORDER BY column_name;
```

5. **Click "Run"**
6. **Verify**: You should see 5 rows in the result showing the new columns

### Step 2: Test the Fix
1. **Go back to your book page**: `http://localhost:3001/books/8f67e22d-f9e1-4abb-96c0-19abf7da25ab`
2. **Click "Buy Now"**
3. **Should now redirect to Telegram** instead of showing an error

## 🔍 Why This Happens

The error occurs because:
- ❌ Your database table `purchases` is missing required columns
- ❌ The code tries to insert data into columns that don't exist
- ✅ Running the SQL adds the missing columns

## 🎯 Expected Result

After running the SQL:
- ✅ No more "item_title" or column errors
- ✅ Purchase creation works
- ✅ Telegram redirect works
- ✅ Complete purchase flow functional

## 🚀 Verification

Run this in your browser console after the fix:
```javascript
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

Should return: `{ success: true, data: { telegramUrl: "...", ... } }`

**This is a one-time fix. Once you run the SQL, everything will work!**