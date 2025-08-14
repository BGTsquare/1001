/**
 * Telegram configuration interface
 */
export interface TelegramConfig {
  botToken: string
  botUsername: string
  adminChannelId: string
  webhookUrl?: string
  webhookSecret?: string
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean
  config?: TelegramConfig
  errors: string[]
}

/**
 * Validates and provides Telegram configuration
 */
export class TelegramConfigValidator {
  /**
   * Validates all required Telegram environment variables
   */
  static validate(): ConfigValidationResult {
    const errors: string[] = []
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      errors.push('TELEGRAM_BOT_TOKEN is required')
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME
    if (!botUsername) {
      errors.push('TELEGRAM_BOT_USERNAME is required')
    }

    const adminChannelId = process.env.TELEGRAM_ADMIN_CHANNEL_ID
    if (!adminChannelId) {
      errors.push('TELEGRAM_ADMIN_CHANNEL_ID is required')
    }

    if (errors.length > 0) {
      return { isValid: false, errors }
    }

    return {
      isValid: true,
      config: {
        botToken: botToken!,
        botUsername: botUsername!,
        adminChannelId: adminChannelId!,
        webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
        webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET
      },
      errors: []
    }
  }

  /**
   * Gets validated configuration or throws an error
   */
  static getConfig(): TelegramConfig {
    const validation = this.validate()
    
    if (!validation.isValid) {
      throw new Error(`Telegram configuration errors: ${validation.errors.join(', ')}`)
    }

    return validation.config!
  }

  /**
   * Checks if Telegram is properly configured
   */
  static isConfigured(): boolean {
    return this.validate().isValid
  }
}