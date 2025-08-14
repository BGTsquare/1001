import { TelegramService } from './telegram-service'
import { PurchaseService } from './purchase-service'
import type { TelegramMessage, TelegramUser } from '@/lib/types/telegram'
import type { Result } from '@/lib/types/result'
import { success, failure } from '@/lib/types/result'

export interface CommandContext {
  chatId: number
  message: TelegramMessage
  user: TelegramUser
  telegramService: TelegramService
  purchaseService: PurchaseService
}

export interface TelegramCommand {
  name: string
  description: string
  pattern: RegExp
  execute(context: CommandContext, args: string[]): Promise<Result<void, string>>
}

export class TelegramCommandHandler {
  private commands = new Map<string, TelegramCommand>()

  registerCommand(command: TelegramCommand): void {
    this.commands.set(command.name, command)
  }

  async handleMessage(context: CommandContext): Promise<Result<void, string>> {
    const text = context.message.text?.trim()
    if (!text) {
      return success(undefined)
    }

    // Find matching command
    for (const command of this.commands.values()) {
      const match = text.match(command.pattern)
      if (match) {
        const args = match.slice(1) // Remove full match, keep capture groups
        return await command.execute(context, args)
      }
    }

    // Handle unknown command
    return await this.handleUnknownCommand(context)
  }

  private async handleUnknownCommand(context: CommandContext): Promise<Result<void, string>> {
    try {
      await context.telegramService.sendMessage(context.chatId, 
        "Welcome to Astewai Digital Bookstore! 📚\n\n" +
        "To purchase a book, please use the purchase link from our website.\n\n" +
        "Available commands:\n" +
        "• /help - Show payment instructions\n" +
        "• /orderstatus [OrderID] - Check order status\n\n" +
        "Need help? Contact our support team."
      )
      return success(undefined)
    } catch (error) {
      return failure(`Failed to send unknown command response: ${error}`)
    }
  }

  getRegisteredCommands(): TelegramCommand[] {
    return Array.from(this.commands.values())
  }
}