import { TelegramService } from './telegram-service'
import { PurchaseService } from './purchase-service'
import { TelegramMessageBuilder } from './telegram-message-builder'
import type { TelegramUpdate, TelegramUser } from '@/lib/types/telegram'

/**
 * Handles Telegram webhook updates and processes different types of messages
 */
export class TelegramWebhookHandler {
  constructor(
    private telegramService: TelegramService,
    private purchaseService: PurchaseService
  ) {}

  /**
   * Main entry point for processing Telegram updates
   */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (!update.message) {
      return
    }

    const { message } = update
    const chatId = message.chat.id
    const text = message.text

    console.log(`💬 Message from ${message.from?.first_name}: "${text}"`)

    try {
      if (text?.startsWith('/start ')) {
        await this.handleStartWithToken(chatId, text, message.from)
      } else if (text === '/start') {
        await this.handleStartCommand(chatId)
      } else if (text?.startsWith('/help')) {
        await this.handleHelpCommand(chatId)
      } else {
        await this.handleUnknownCommand(chatId)
      }
    } catch (error) {
      await this.handleError(error, chatId)
    }
  }

  /**
   * Handles /start command with token parameter
   */
  private async handleStartWithToken(chatId: number, text: string, user?: TelegramUser): Promise<void> {
    const token = text.split(' ')[1]
    console.log(`🚀 Processing /start with token: ${token}`)
    
    if (!user) {
      console.error('❌ Message from is undefined')
      return
    }
    
    const purchaseData = await this.purchaseService.getPurchaseByToken(token)
    
    if (!purchaseData) {
      console.log('❌ Purchase not found for token:', token)
      await this.sendInvalidTokenMessage(chatId)
      return
    }

    console.log('✅ Found purchase:', purchaseData.purchase.id)

    const messageBuilder = new TelegramMessageBuilder(
      purchaseData.purchase, 
      purchaseData.paymentOptions
    )
    const message = messageBuilder.buildPurchaseMessage()

    await this.telegramService.sendMessage(chatId, message)
    console.log('✅ Sent purchase information to user')
  }

  /**
   * Handles /start command without token
   */
  private async handleStartCommand(chatId: number): Promise<void> {
    const message = TelegramMessageBuilder.buildWelcomeMessage()
    await this.telegramService.sendMessage(chatId, message)
  }

  /**
   * Handles /help command
   */
  private async handleHelpCommand(chatId: number): Promise<void> {
    const message = TelegramMessageBuilder.buildHelpMessage()
    await this.telegramService.sendMessage(chatId, message)
  }

  /**
   * Handles unknown commands
   */
  private async handleUnknownCommand(chatId: number): Promise<void> {
    const message = TelegramMessageBuilder.buildUnknownCommandMessage()
    await this.telegramService.sendMessage(chatId, message)
  }

  /**
   * Sends invalid token message
   */
  private async sendInvalidTokenMessage(chatId: number): Promise<void> {
    const message = TelegramMessageBuilder.buildInvalidTokenMessage()
    await this.telegramService.sendMessage(chatId, message)
  }

  /**
   * Handles errors that occur during message processing
   */
  private async handleError(error: unknown, chatId: number): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const timestamp = new Date().toISOString()
    
    console.error(`❌ [${timestamp}] Error handling Telegram message:`, {
      error: errorMessage,
      chatId,
      stack: error instanceof Error ? error.stack : undefined
    })

    try {
      await this.telegramService.sendMessage(chatId, 
        "❌ Something went wrong. Please try again or contact support."
      )
    } catch (sendError) {
      console.error('Failed to send error message to user:', sendError)
    }
  }
}