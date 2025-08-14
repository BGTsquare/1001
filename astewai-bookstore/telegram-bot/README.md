# Astewai Telegram Bot

This Telegram bot handles payment processing for the Astewai Digital Bookstore. It orchestrates manual payments by providing payment instructions, collecting proof of payment, and facilitating admin verification.

## Features

- **Payment Initiation**: Receives users redirected from the website with secure tokens
- **Payment Instructions**: Provides bank account and mobile money payment details
- **Proof Collection**: Accepts payment receipt screenshots from users
- **Admin Verification**: Forwards payment proofs to admin channel with approve/reject buttons
- **Status Updates**: Notifies users about payment approval/rejection
- **Secure Integration**: Authenticated API calls to the main website

## Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command to create a new bot
3. Choose a name and username for your bot (e.g., `AstewaiBookstoreBot`)
4. Save the bot token provided by BotFather

### 2. Create Admin Channel

1. Create a private Telegram channel for admin notifications
2. Add your bot as an administrator to the channel
3. Get the channel ID (you can use [@userinfobot](https://t.me/userinfobot))

### 3. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required environment variables:
   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
   TELEGRAM_ADMIN_CHANNEL_ID=your-admin-channel-id
   WEBSITE_API_URL=http://localhost:3001
   BOT_SECRET_TOKEN=your-secure-bot-secret-token-here
   NODE_ENV=development
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Build and Run

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

## Bot Workflow

### 1. Purchase Initiation
- User clicks "Buy Now" on website
- Website creates purchase record with initiation token
- User is redirected to Telegram bot with token: `https://t.me/YourBot?start=<token>`

### 2. Payment Instructions
- Bot validates token and finds purchase record
- Bot updates purchase with Telegram user data
- Bot sends formatted payment instructions with transaction reference

### 3. Proof Submission
- User sends payment receipt screenshot to bot
- Bot updates purchase status to "pending_verification"
- Bot forwards screenshot with purchase details to admin channel

### 4. Admin Verification
- Admin receives notification in private channel
- Admin clicks "Approve" or "Reject" button
- Bot calls website API to finalize purchase
- Bot notifies user of the decision

## API Integration

The bot communicates with the main website through these endpoints:

- `GET /api/purchases/find-by-token` - Find purchase by initiation token
- `POST /api/purchases/update-telegram-data` - Store Telegram user data
- `POST /api/purchases/update-status` - Update purchase status
- `POST /api/purchases/finalize` - Approve or reject purchase
- `GET /api/payments/config` - Get payment method configurations

All API calls are authenticated using the `BOT_SECRET_TOKEN`.

## Security

- **Token Validation**: Initiation tokens are single-use and validated
- **API Authentication**: All website API calls use secret token authentication
- **Admin Channel**: Only authorized admins can approve/reject payments
- **User Verification**: Bot verifies user identity through Telegram ID

## Deployment

### Using PM2 (Recommended)

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Create ecosystem file (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'astewai-telegram-bot',
       script: 'dist/index.js',
       env: {
         NODE_ENV: 'production'
       }
     }]
   }
   ```

3. Start with PM2:
   ```bash
   npm run build
   pm2 start ecosystem.config.js
   ```

### Using Docker

1. Create `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   CMD ["node", "dist/index.js"]
   ```

2. Build and run:
   ```bash
   npm run build
   docker build -t astewai-telegram-bot .
   docker run -d --env-file .env astewai-telegram-bot
   ```

## Monitoring

The bot logs important events and errors to the console. In production, consider:

- Using a logging service (e.g., Winston with file/database transport)
- Setting up error monitoring (e.g., Sentry)
- Implementing health checks
- Monitoring bot uptime and response times

## Troubleshooting

### Bot Not Responding
- Check if bot token is correct
- Verify bot is running and not crashed
- Check network connectivity to Telegram servers

### API Errors
- Verify `BOT_SECRET_TOKEN` matches website configuration
- Check website API endpoints are accessible
- Review API error logs on website

### Admin Notifications Not Working
- Verify admin channel ID is correct
- Ensure bot is added as administrator to the channel
- Check bot has permission to send messages to the channel

## Development

### Adding New Features

1. Update types in `src/types.ts`
2. Add API methods in `src/api.ts`
3. Implement bot handlers in `src/bot.ts`
4. Update website API endpoints as needed

### Testing

Currently, testing is manual. Consider adding:
- Unit tests for API integration
- Integration tests for bot handlers
- End-to-end tests for complete workflows

## Support

For issues or questions:
- Check the logs for error messages
- Review the bot configuration
- Ensure all environment variables are set correctly
- Verify Telegram bot permissions and channel setup