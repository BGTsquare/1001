import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Telegram Bot Configuration
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  adminChannelId: process.env.TELEGRAM_ADMIN_CHANNEL_ID || '',
  
  // Website API Configuration
  websiteApiUrl: process.env.WEBSITE_API_URL || 'http://localhost:3001',
  botSecretToken: process.env.BOT_SECRET_TOKEN || '',
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Validation
  isValid(): boolean {
    return !!(
      this.botToken &&
      this.adminChannelId &&
      this.websiteApiUrl &&
      this.botSecretToken
    )
  },
  
  // Get missing configuration
  getMissingConfig(): string[] {
    const missing: string[] = []
    
    if (!this.botToken) missing.push('TELEGRAM_BOT_TOKEN')
    if (!this.adminChannelId) missing.push('TELEGRAM_ADMIN_CHANNEL_ID')
    if (!this.websiteApiUrl) missing.push('WEBSITE_API_URL')
    if (!this.botSecretToken) missing.push('BOT_SECRET_TOKEN')
    
    return missing
  }
}

// Validate configuration on import
if (!config.isValid()) {
  const missing = config.getMissingConfig()
  console.error('❌ Missing required environment variables:', missing.join(', '))
  console.error('Please check your .env file and ensure all required variables are set.')
  process.exit(1)
}