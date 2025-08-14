/**
 * Configuration service for managing environment variables and app settings
 */

export interface TelegramConfig {
  botToken: string
  botUsername: string
  adminChannelId: string
}

export interface AppConfig {
  siteUrl: string
  telegram: TelegramConfig
}

export class ConfigService {
  private static instance: ConfigService | null = null

  static getInstance(): ConfigService {
    if (!this.instance) {
      this.instance = new ConfigService()
    }
    return this.instance
  }

  getTelegramConfig(): TelegramConfig {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const botUsername = process.env.TELEGRAM_BOT_USERNAME
    const adminChannelId = process.env.TELEGRAM_ADMIN_CHANNEL_ID

    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is required')
    }

    if (!botUsername) {
      throw new Error('TELEGRAM_BOT_USERNAME environment variable is required')
    }

    if (!adminChannelId) {
      throw new Error('TELEGRAM_ADMIN_CHANNEL_ID environment variable is required')
    }

    // Validate bot username format
    if (!/^[a-zA-Z0-9_]{5,32}$/.test(botUsername)) {
      throw new Error('Invalid TELEGRAM_BOT_USERNAME format')
    }

    return {
      botToken,
      botUsername,
      adminChannelId
    }
  }

  getAppConfig(): AppConfig {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    if (!siteUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required')
    }

    return {
      siteUrl,
      telegram: this.getTelegramConfig()
    }
  }

  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      this.getAppConfig()
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance()