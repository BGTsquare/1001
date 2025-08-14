# Telegram Bot Setup Guide

This guide will help you set up the Telegram bot integration for your Astewai Digital Bookstore.

## 🤖 Bot Features

When users click "Buy Now" on a book, they will be redirected to your Telegram bot which will:

1. **Show book information** with price in Ethiopian Birr
2. **Display payment options** (Telebirr, CBE, Awash Bank, M-Birr)
3. **Provide payment instructions** with account details
4. **Handle payment confirmations** and notify admins
5. **Update purchase status** automatically

## 📋 Prerequisites

1. **Telegram Bot Token** - Get this from @BotFather on Telegram
2. **Admin Channel ID** - Create a Telegram channel for admin notifications
3. **Deployed Application** - Your app must be accessible via HTTPS

## 🔧 Setup Steps

### 1. Create Telegram Bot

1. Message @BotFather on Telegram
2. Send `/newbot`
3. Choose a name and username for your bot
4. Save the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Create Admin Channel

1. Create a new Telegram channel
2. Add your bot as an administrator
3. Get the channel ID (format: `-1001234567890`)

### 3. Update Environment Variables

Update your `.env.local` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_NAME=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHANNEL_ID=your_channel_id_here
```

### 4. Update Payment Configuration

Run this SQL in your Supabase SQL editor:

```sql
-- Update payment configuration
DELETE FROM payment_config;

INSERT INTO payment_config (config_type, provider_name, account_number, account_name, instructions, display_order, is_active)
VALUES 
  ('mobile_money', 'Telebirr', '0911123456', 'Astewai Digital Bookstore', 'Send payment to this Telebirr number. Include your transaction reference in the payment description.', 1, true),
  ('bank_account', 'Commercial Bank of Ethiopia (CBE)', '1000123456789', 'Astewai Digital Bookstore', 'Transfer to this CBE account. Use your transaction reference as the transfer description.', 2, true),
  ('bank_account', 'Awash Bank', '01320123456789', 'Astewai Digital Bookstore', 'Transfer to this Awash Bank account. Include your transaction reference in the transfer note.', 3, true),
  ('mobile_money', 'M-Birr', '0922123456', 'Astewai Store', 'Send payment via M-Birr. Include your transaction reference in the payment note.', 4, true);
```

**⚠️ Important**: Replace the account numbers with your actual payment account details!

### 5. Deploy Your Application

Deploy your application to a platform like Vercel, Netlify, or your own server. The webhook endpoint must be accessible at:
```
https://your-domain.com/api/telegram/webhook
```

### 6. Set Up Webhook

After deployment, run the setup script:

```bash
# Update the script with your bot token and domain
node setup-telegram-bot.js
```

Or manually set the webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

## 💰 Currency Configuration

The system automatically converts USD prices to Ethiopian Birr using a configurable exchange rate:

- **Current Rate**: 1 USD = 120 Birr
- **Update Location**: `src/utils/format.ts` and `src/app/api/telegram/webhook/route.ts`

To update the exchange rate, modify the `USD_TO_BIRR_RATE` constant in both files.

## 🔄 Purchase Flow

1. **User clicks "Buy Now"** → Redirected to Telegram bot
2. **Bot shows book info** → Price in Birr + payment options
3. **User makes payment** → Sends money to provided account
4. **User confirms payment** → Types "PAID" in bot
5. **Admin gets notification** → Verifies payment in admin channel
6. **Admin approves** → Book added to user's library

## 🧪 Testing

1. **Test Bot Connection**:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
   ```

2. **Test Purchase Flow**:
   - Go to a book page
   - Click "Buy Now"
   - Should redirect to Telegram bot
   - Bot should show book info and payment options

3. **Test Payment Confirmation**:
   - In bot, type "PAID"
   - Should update purchase status
   - Admin should receive notification

## 🛠️ Troubleshooting

### Bot Not Responding
- Check if webhook is set correctly
- Verify bot token in environment variables
- Check application logs for errors

### Payment Options Not Showing
- Verify payment_config table has data
- Check if configs are marked as active
- Ensure database migration was applied

### Admin Notifications Not Working
- Verify admin channel ID is correct
- Check if bot is admin in the channel
- Ensure channel ID includes the minus sign

### Currency Not Showing as Birr
- Check if `formatPrice` function was updated
- Verify USD_TO_BIRR_RATE is set correctly
- Clear browser cache and reload

## 📞 Support

If you encounter issues:

1. Check the application logs
2. Verify all environment variables are set
3. Test the webhook endpoint manually
4. Ensure the bot has proper permissions

## 🔐 Security Notes

- Keep your bot token secure
- Use HTTPS for webhook endpoints
- Validate all incoming webhook data
- Implement rate limiting if needed