import type { TelegramCommand, CommandContext } from '../telegram-command-handler'
import type { Result } from '@/lib/types/result'
import { success, failure } from '@/lib/types/result'
import { createClient } from '@/lib/supabase/server'

export class StartCommand implements TelegramCommand {
  name = 'start'
  description = 'Start purchase process with initiation token'
  pattern = /^\/start\s+(.+)$/

  async execute(context: CommandContext, args: string[]): Promise<Result<void, string>> {
    const [token] = args
    if (!token) {
      return failure('No initiation token provided')
    }

    try {
      // Get purchase information using the service
      const purchaseData = await context.purchaseService.getPurchaseByToken(token)
      
      if (!purchaseData) {
        await context.telegramService.sendMessage(context.chatId, 
          "❌ Invalid or expired purchase link. Please try again from our website."
        )
        return success(undefined)
      }

      const { purchase, paymentOptions } = purchaseData

      // Update purchase with Telegram user info
      await context.purchaseService.updatePurchaseWithTelegram(
        purchase.id, 
        context.chatId, 
        context.user.id
      )

      // Send book cover image if available
      if (purchase.itemType === 'book') {
        const supabase = await createClient()
        const { data: bookData } = await supabase
          .from('books')
          .select('cover_image_url')
          .eq('id', purchase.itemId)
          .single()

        if (bookData?.cover_image_url) {
          await context.telegramService.sendPhoto(context.chatId, bookData.cover_image_url, 
            `📚 **${purchase.itemTitle}**`
          )
        }
      }

      // Get payment instructions from admin settings (fallback to default)
      const paymentInstructions = this.getDefaultPaymentInstructions()

      // Format payment options message
      let paymentOptionsText = ""
      paymentOptions.forEach((option: any, index: number) => {
        paymentOptionsText += `\n${index + 1}. **${option.providerName}**\n`
        paymentOptionsText += `   Account: ${option.accountNumber}\n`
        paymentOptionsText += `   Name: ${option.accountName}\n`
        if (option.instructions) {
          paymentOptionsText += `   📝 ${option.instructions}\n`
        }
        paymentOptionsText += "\n"
      })

      const message = 
        `📚 **${purchase.itemTitle}**\n` +
        `💵 **Price:** ${purchase.amountInBirr} Birr\n\n` +
        `${paymentInstructions}\n\n` +
        `💳 **Payment Options:**${paymentOptionsText}` +
        `**Order ID:** ${purchase.transactionReference}\n\n` +
        `📱 **Commands:**\n` +
        `• /help - Show payment instructions again\n` +
        `• /orderstatus ${purchase.transactionReference} - Check order status\n\n` +
        `Need help? Contact our support team.`

      await context.telegramService.sendMessage(context.chatId, message)
      return success(undefined)

    } catch (error) {
      console.error('Error handling purchase start:', error)
      await context.telegramService.sendMessage(context.chatId, 
        "❌ Something went wrong. Please try again or contact support."
      )
      return failure(`Failed to handle start command: ${error}`)
    }
  }

  private getDefaultPaymentInstructions(): string {
    return `To purchase this book, please send your payment to one of the following accounts:

1. **Commercial Bank of Ethiopia** - [Account Number]
2. **Awash Bank** - [Account Number]  
3. **Telebirr** - [Account Number]

After payment, send your payment confirmation screenshot here.`
  }
}