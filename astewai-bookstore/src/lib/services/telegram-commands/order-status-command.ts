import type { TelegramCommand, CommandContext } from '../telegram-command-handler'
import type { Result } from '@/lib/types/result'
import { success, failure } from '@/lib/types/result'
import { PURCHASE_STATUS_LABELS } from '@/lib/constants/purchase-status'

export class OrderStatusCommand implements TelegramCommand {
  name = 'orderstatus'
  description = 'Check order status by Order ID'
  pattern = /^\/orderstatus\s+(.+)$/

  async execute(context: CommandContext, args: string[]): Promise<Result<void, string>> {
    const [orderId] = args
    if (!orderId) {
      await context.telegramService.sendMessage(context.chatId, 
        "❌ Please provide an Order ID. Example: /orderstatus AST-12345-ABCD"
      )
      return success(undefined)
    }

    try {
      const purchase = await context.purchaseService.findPurchaseByOrderId(orderId, context.chatId)
      
      if (!purchase) {
        await context.telegramService.sendMessage(context.chatId, 
          `❌ Order not found. Please check your Order ID: ${orderId}`
        )
        return success(undefined)
      }

      const statusLabel = PURCHASE_STATUS_LABELS[purchase.status as keyof typeof PURCHASE_STATUS_LABELS] || "❓ Unknown Status"
      
      const message = 
        `📋 **Order Status**\n\n` +
        `**Order ID:** ${purchase.transaction_reference}\n` +
        `**Status:** ${statusLabel}\n` +
        `**Amount:** ${purchase.amount_in_birr} Birr\n` +
        `**Book:** ${purchase.item_title}\n` +
        `**Created:** ${new Date(purchase.created_at).toLocaleDateString()}\n\n` +
        `Need help? Contact our support team.`

      await context.telegramService.sendMessage(context.chatId, message)
      return success(undefined)

    } catch (error) {
      console.error('Error handling order status:', error)
      await context.telegramService.sendMessage(context.chatId, 
        "❌ Something went wrong. Please try again later."
      )
      return failure(`Failed to handle order status command: ${error}`)
    }
  }
}