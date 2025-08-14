import { Telegraf, Context, Markup } from 'telegraf'
import { config } from './config'
import { websiteAPI } from './api'
import type { Purchase, PaymentConfig } from './types'

interface BotContext extends Context {
  // Add any custom context properties here
}

class AstewaiBot {
  private bot: Telegraf<BotContext>
  private userSessions: Map<number, { purchase?: Purchase }> = new Map()

  constructor() {
    this.bot = new Telegraf<BotContext>(config.botToken)
    this.setupHandlers()
  }

  private setupHandlers() {
    // Start command handler
    this.bot.start(this.handleStart.bind(this))
    
    // Photo handler for proof of payment
    this.bot.on('photo', this.handlePhoto.bind(this))
    
    // Callback query handler for admin actions
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this))
    
    // Error handler
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err)
      ctx.reply('Sorry, something went wrong. Please try again or contact support.')
    })
  }

  /**
   * Handle /start command with initiation token
   */
  private async handleStart(ctx: BotContext) {
    try {
      const args = ctx.message?.text?.split(' ')
      const token = args && args.length > 1 ? args[1] : null

      if (!token) {
        await ctx.reply(
          '👋 Welcome to Astewai Digital Bookstore!\n\n' +
          'To make a purchase, please use the link from our website.'
        )
        return
      }

      // Find purchase by token
      const purchase = await websiteAPI.findPurchaseByToken(token)
      
      if (!purchase) {
        await ctx.reply(
          '❌ This link has expired or is invalid.\n\n' +
          'Please get a new purchase link from our website.'
        )
        return
      }

      // Store purchase in session
      const userId = ctx.from?.id
      if (userId) {
        this.userSessions.set(userId, { purchase })
      }

      // Update purchase with Telegram user data
      const telegramData = {
        chat_id: ctx.chat?.id || 0,
        user_id: ctx.from?.id || 0,
        username: ctx.from?.username,
        first_name: ctx.from?.first_name,
        last_name: ctx.from?.last_name
      }

      await websiteAPI.updateTelegramUserData(purchase.purchase_id, telegramData)
      await websiteAPI.updatePurchaseStatus(purchase.purchase_id, 'awaiting_payment')

      // Send payment instructions
      await this.sendPaymentInstructions(ctx, purchase)

    } catch (error) {
      console.error('Error in start handler:', error)
      await ctx.reply('Sorry, something went wrong. Please try again.')
    }
  }

  /**
   * Send payment instructions to user
   */
  private async sendPaymentInstructions(ctx: BotContext, purchase: Purchase) {
    try {
      // Get payment configuration
      const paymentConfigs = await websiteAPI.getPaymentConfig()
      
      if (paymentConfigs.length === 0) {
        await ctx.reply(
          '❌ Payment methods are currently unavailable.\n\n' +
          'Please contact our support team for assistance.'
        )
        return
      }

      let message = `📚 **${purchase.item_title}**\n`
      message += `💰 Amount: $${purchase.amount}\n`
      message += `🔖 Transaction Reference: \`${purchase.transaction_reference}\`\n\n`
      
      message += '💳 **Payment Methods:**\n\n'
      
      paymentConfigs.forEach((config, index) => {
        const emoji = config.config_type === 'bank_account' ? '🏦' : '📱'
        message += `${emoji} **${config.provider_name}**\n`
        message += `Account: \`${config.account_number}\`\n`
        message += `Name: ${config.account_name}\n`
        
        if (config.instructions) {
          message += `${config.instructions}\n`
        }
        
        if (index < paymentConfigs.length - 1) {
          message += '\n'
        }
      })

      message += '\n⚠️ **Important Instructions:**\n'
      message += `• Include your transaction reference: \`${purchase.transaction_reference}\`\n`
      message += '• After payment, send a screenshot of your receipt to this chat\n'
      message += '• Our team will verify and approve your payment\n\n'
      message += '📸 **Send your payment receipt screenshot now**'

      await ctx.replyWithMarkdownV2(this.escapeMarkdown(message))

    } catch (error) {
      console.error('Error sending payment instructions:', error)
      await ctx.reply('Error loading payment instructions. Please contact support.')
    }
  }

  /**
   * Handle photo messages (proof of payment)
   */
  private async handlePhoto(ctx: BotContext) {
    try {
      const userId = ctx.from?.id
      if (!userId) return

      const session = this.userSessions.get(userId)
      if (!session?.purchase) {
        await ctx.reply(
          '❌ No pending purchase found.\n\n' +
          'Please start a new purchase from our website.'
        )
        return
      }

      const purchase = session.purchase

      // Update purchase status
      await websiteAPI.updatePurchaseStatus(purchase.purchase_id, 'pending_verification')

      // Forward to admin channel
      await this.forwardToAdminChannel(ctx, purchase)

      // Confirm receipt to user
      await ctx.reply(
        '✅ **Payment proof received!**\n\n' +
        'Thank you for your payment. Our team will verify it shortly and you will be notified once approved.\n\n' +
        '⏱️ Verification usually takes a few minutes during business hours.'
      )

      // Clear session
      this.userSessions.delete(userId)

    } catch (error) {
      console.error('Error handling photo:', error)
      await ctx.reply('Error processing your payment proof. Please try again.')
    }
  }

  /**
   * Forward payment proof to admin channel
   */
  private async forwardToAdminChannel(ctx: BotContext, purchase: Purchase) {
    try {
      const adminMessage = 
        `🔔 **New Payment Verification Request**\n\n` +
        `👤 User: ${purchase.user_name} (${purchase.user_email})\n` +
        `📚 Item: ${purchase.item_title}\n` +
        `💰 Amount: $${purchase.amount}\n` +
        `🔖 Reference: \`${purchase.transaction_reference}\`\n` +
        `📅 Date: ${new Date(purchase.created_at).toLocaleString()}`

      // Forward the photo to admin channel
      if (ctx.message && 'photo' in ctx.message) {
        await this.bot.telegram.sendPhoto(
          config.adminChannelId,
          ctx.message.photo[ctx.message.photo.length - 1].file_id,
          {
            caption: adminMessage,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Approve', callback_data: `approve:${purchase.purchase_id}` },
                { text: '❌ Reject', callback_data: `reject:${purchase.purchase_id}` }
              ]]
            }
          }
        )
      }

    } catch (error) {
      console.error('Error forwarding to admin channel:', error)
    }
  }

  /**
   * Handle admin callback queries (approve/reject)
   */
  private async handleCallbackQuery(ctx: BotContext) {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return

      const [action, purchaseId] = ctx.callbackQuery.data.split(':')
      
      if (!['approve', 'reject'].includes(action) || !purchaseId) {
        await ctx.answerCbQuery('Invalid action')
        return
      }

      const status = action === 'approve' ? 'completed' : 'rejected'
      const result = await websiteAPI.finalizePurchase(purchaseId, status)

      if (!result) {
        await ctx.answerCbQuery('Failed to process action')
        return
      }

      // Update admin message
      const emoji = action === 'approve' ? '✅' : '❌'
      const statusText = action === 'approve' ? 'APPROVED' : 'REJECTED'
      
      await ctx.editMessageCaption(
        ctx.callbackQuery.message?.caption + `\n\n${emoji} **${statusText}**`,
        { parse_mode: 'Markdown' }
      )

      // Notify user
      await this.notifyUser(result, action === 'approve')

      await ctx.answerCbQuery(`Payment ${statusText.toLowerCase()}`)

    } catch (error) {
      console.error('Error handling callback query:', error)
      await ctx.answerCbQuery('Error processing action')
    }
  }

  /**
   * Notify user about payment approval/rejection
   */
  private async notifyUser(data: any, approved: boolean) {
    try {
      // This would require storing chat IDs or using the purchase data
      // For now, we'll log it - in production, you'd need to implement user notification
      console.log(`User notification: Payment ${approved ? 'approved' : 'rejected'} for ${data.user.email}`)
      
      // TODO: Implement user notification logic
      // You could store chat IDs in the database or use other notification methods
      
    } catch (error) {
      console.error('Error notifying user:', error)
    }
  }

  /**
   * Escape markdown characters for Telegram
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
  }

  /**
   * Start the bot
   */
  async start() {
    try {
      console.log('🤖 Starting Astewai Telegram Bot...')
      
      // Get bot info
      const botInfo = await this.bot.telegram.getMe()
      console.log(`✅ Bot started: @${botInfo.username}`)
      
      // Start polling
      await this.bot.launch()
      
      console.log('🚀 Bot is running and ready to receive messages!')
      
      // Graceful shutdown
      process.once('SIGINT', () => this.bot.stop('SIGINT'))
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
      
    } catch (error) {
      console.error('❌ Failed to start bot:', error)
      process.exit(1)
    }
  }
}

export { AstewaiBot }