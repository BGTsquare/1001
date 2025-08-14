import type { TelegramCommand, CommandContext } from '../telegram-command-handler'
import type { Result } from '@/lib/types/result'
import { success, failure } from '@/lib/types/result'

export class HelpCommand implements TelegramCommand {
  name = 'help'
  description = 'Show payment instructions and available commands'
  pattern = /^\/help$/

  async execute(context: CommandContext): Promise<Result<void, string>> {
    try {
      const helpMessage = this.getHelpMessage()
      await context.telegramService.sendMessage(context.chatId, helpMessage)
      return success(undefined)
    } catch (error) {
      return failure(`Failed to send help message: ${error}`)
    }
  }

  private getHelpMessage(): string {
    return `📚 **Astewai Digital Bookstore Help**

**How to Purchase:**
1️⃣ Visit our website and click "Buy Now" on any book
2️⃣ You'll be redirected here with payment instructions
3️⃣ Send payment to one of our accounts
4️⃣ Send screenshot or type "PAID" to confirm
5️⃣ We'll verify and deliver your book within 24 hours

**Payment Methods:**
• Telebirr
• Commercial Bank of Ethiopia (CBE)
• Awash Bank
• M-Birr

**Commands:**
• /help - Show this help message
• /orderstatus [OrderID] - Check your order status

**Support:**
If you need help, please contact our support team with your Order ID.`
  }
}