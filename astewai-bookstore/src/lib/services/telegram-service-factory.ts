import { TelegramService } from './telegram-service'

export class TelegramServiceFactory {
  private static instance: TelegramService | null = null

  static getInstance(): TelegramService | null {
    if (!this.instance) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN not configured')
        return null
      }
      this.instance = new TelegramService(botToken)
    }
    return this.instance
  }

  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      errors.push('TELEGRAM_BOT_TOKEN is required')
    }
    
    if (!process.env.TELEGRAM_BOT_USERNAME) {
      errors.push('TELEGRAM_BOT_USERNAME is required')
    }
    
    if (!process.env.TELEGRAM_ADMIN_CHANNEL_ID) {
      errors.push('TELEGRAM_ADMIN_CHANNEL_ID is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}