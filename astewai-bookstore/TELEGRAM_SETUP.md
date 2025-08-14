# Telegram Purchase Flow Setup

This document explains how to set up and configure the Telegram purchase flow for the Astewai Bookstore.

## Overview

The Telegram purchase flow allows users to:
1. Click "Buy Now" on the website and get redirected to Telegram
2. Receive book details and payment instructions in the bot
3. Send payment screenshots for verification
4. Get approved by admin and receive secure reading links

## Environment Variables

Add these to your `.env.local` file:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username_here
TELEGRAM_ADMIN_CHANNEL_ID=your_admin_channel_id_here
```

### Getting the Bot Token and Username

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the bot token and username (without @) and add them to your environment variables
4. Example: If your bot is @astewai_bookstore_bot, use `TELEGRAM_BOT_USERNAME=astewai_bookstore_bot`

### Getting the Admin Channel ID

1. Create a Telegram channel for admin notifications
2. Add your bot as an admin to the channel
3. Send a message to the channel
4. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Find your channel ID in the response (it will be negative for channels)

## Database Setup

Run the migration to create the required tables:

```bash
# Apply the Telegram migration
supabase db push
```

This creates:
- `purchase_screenshots` - Stores payment proof images
- `reading_tokens` - Secure tokens for book access
- `admin_settings` - Configurable bot messages

## Webhook Setup

### Development

For local development, use ngrok to expose your webhook:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Set the webhook URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.io/api/telegram/webhook"}'
```

### Production

Set the webhook URL to your production domain:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

## Testing

Use the test script to verify your webhook:

```bash
# Test help command
node scripts/test-telegram-webhook.js help

# Test all commands
node scripts/test-telegram-webhook.js all
```

## Purchase Flow

### 1. User Initiates Purchase

When a user clicks "Buy Now" on a book:
1. A purchase record is created with `pending_initiation` status
2. An initiation token is generated
3. User is redirected to Telegram with: `https://t.me/your_bot?start=<token>`

### 2. Bot Shows Book Details

When user starts the bot:
1. Bot fetches purchase details using the token
2. Shows book name, price in ETB, and cover image (optional)
3. Displays payment instructions and account details
4. Updates purchase status to `awaiting_payment`

### 3. User Sends Payment

User can:
- Send a payment screenshot (JPG, PNG, WebP, max 5MB)
- Type "PAID" or similar text confirmation

### 4. Admin Verification

1. Bot forwards payment proof to admin channel
2. Admin uses commands in Telegram:
   - `/approve <OrderID>` - Approves the purchase
   - `/reject <OrderID>` - Rejects the purchase

### 5. User Gets Access

If approved:
- User receives a secure reading link
- Link is unique and expires after 30 days
- Book can only be read online, no download

## Bot Commands

### User Commands
- `/help` - Show payment instructions and help
- `/orderstatus <OrderID>` - Check order status

### Admin Commands (Admin Channel Only)
- `/approve <OrderID>` - Approve a purchase
- `/reject <OrderID>` - Reject a purchase

## Admin Interface

Access the Telegram admin panel at `/admin/telegram` to:
- Configure bot messages (payment instructions, help text)
- View recent Telegram purchases
- Monitor bot status and configuration

## Security Features

### Secure Reading Mode
- Right-click disabled
- Text selection disabled
- No download option
- Unique access tokens
- Token expiration (30 days)
- User authentication required

### Payment Verification
- Manual admin approval required
- Screenshot storage with file validation
- Order ID tracking
- Status monitoring

## Currency

All prices are displayed in Ethiopian Birr (ETB). The system no longer uses USD conversion.

## Troubleshooting

### Bot Not Responding
1. Check `TELEGRAM_BOT_TOKEN` is set correctly
2. Verify webhook URL is accessible
3. Check bot has necessary permissions

### Admin Commands Not Working
1. Verify `TELEGRAM_ADMIN_CHANNEL_ID` is correct
2. Ensure bot is admin in the channel
3. Check channel ID is negative for channels

### Payment Screenshots Not Forwarding
1. Check admin channel configuration
2. Verify bot permissions in admin channel
3. Check file size limits (5MB max)

### Reading Links Not Working
1. Verify user authentication
2. Check token expiration
3. Ensure purchase is approved

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── telegram/
│   │       ├── webhook/route.ts          # Main webhook handler
│   │       └── purchase-info/route.ts    # Purchase data API
│   ├── admin/
│   │   └── telegram/page.tsx             # Admin interface
│   └── library/
│       └── read/[token]/page.tsx         # Secure reading page
├── components/
│   ├── admin/
│   │   ├── telegram-settings-form.tsx   # Settings management
│   │   └── telegram-purchases-list.tsx  # Purchase monitoring
│   └── library/
│       └── book-reader.tsx               # Secure book reader
├── lib/
│   └── services/
│       ├── telegram-service.ts           # Telegram API wrapper
│       └── purchase-service.ts           # Purchase operations
└── scripts/
    └── test-telegram-webhook.js          # Testing utility
```

## Support

For issues with the Telegram integration:
1. Check the admin interface for bot status
2. Review webhook logs in your deployment platform
3. Test with the provided test script
4. Verify all environment variables are set correctly