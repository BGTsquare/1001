import type { PurchaseInfo, PaymentOption } from '@/lib/services/purchase-service'

/**
 * Builder class for constructing Telegram messages related to purchases
 */
export class TelegramMessageBuilder {
  constructor(
    private purchase: PurchaseInfo,
    private paymentOptions: PaymentOption[]
  ) {}

  /**
   * Builds the complete purchase information message
   */
  buildPurchaseMessage(): string {
    return [
      this.buildHeader(),
      this.buildPaymentInstructions(),
      this.buildFooter()
    ].join('\n')
  }

  /**
   * Builds the header section with book title and price
   */
  private buildHeader(): string {
    return `📚 **${this.purchase.itemTitle}**\n` +
           `💵 **Price:** ${this.purchase.amountInBirr} Birr\n`
  }

  /**
   * Builds the payment instructions section
   */
  private buildPaymentInstructions(): string {
    const instructions = `💳 **Payment Instructions:**\n` +
                        `Please send payment to one of these accounts:\n\n`
    
    if (this.paymentOptions.length > 0) {
      return instructions + this.buildPaymentOptions()
    } else {
      return instructions + this.buildDefaultPaymentOptions()
    }
  }

  /**
   * Builds payment options from database configuration
   */
  private buildPaymentOptions(): string {
    return this.paymentOptions
      .map((option, index) => this.formatPaymentOption(option, index + 1))
      .join('\n')
  }

  /**
   * Formats a single payment option
   */
  private formatPaymentOption(option: PaymentOption, index: number): string {
    let formatted = `${index}. **${option.providerName}**\n` +
                   `   Account: ${option.accountNumber}\n` +
                   `   Name: ${option.accountName}\n`
    
    if (option.instructions) {
      formatted += `   📝 ${option.instructions}\n`
    }
    
    return formatted + '\n'
  }

  /**
   * Builds default payment options when none are configured
   */
  private buildDefaultPaymentOptions(): string {
    return `1. **Commercial Bank of Ethiopia**\n` +
           `   Account: [Your Account Number]\n` +
           `   Name: Astewai Bookstore\n\n` +
           `2. **Telebirr**\n` +
           `   Number: [Your Telebirr Number]\n\n`
  }

  /**
   * Builds the footer section with order ID and instructions
   */
  private buildFooter(): string {
    return `**Order ID:** ${this.purchase.transactionReference}\n\n` +
           `📱 After payment, send a screenshot here or type "PAID"\n\n` +
           `❓ Need help? Type /help`
  }

  /**
   * Static method to build help message
   */
  static buildHelpMessage(): string {
    return "📚 **Astewai Digital Bookstore Help**\n\n" +
      "**How to Purchase:**\n" +
      "1️⃣ Visit our website and click 'Buy Now' on any book\n" +
      "2️⃣ You'll be redirected here with payment instructions\n" +
      "3️⃣ Follow the payment instructions\n" +
      "4️⃣ Send payment confirmation\n\n" +
      "**Commands:**\n" +
      "• /help - Show this help message\n\n" +
      "Need help? Contact our support team."
  }

  /**
   * Static method to build welcome message
   */
  static buildWelcomeMessage(): string {
    return "👋 Welcome to Astewai Digital Bookstore!\n\n" +
      "To purchase a book, please use the purchase link from our website.\n\n" +
      "Visit: https://astewai-bookstore.com"
  }

  /**
   * Static method to build unknown command message
   */
  static buildUnknownCommandMessage(): string {
    return "🤖 I didn't understand that command.\n\n" +
      "Available commands:\n" +
      "• /help - Show help information\n\n" +
      "To purchase a book, please use the purchase link from our website."
  }

  /**
   * Static method to build invalid token message
   */
  static buildInvalidTokenMessage(): string {
    return "❌ Invalid or expired purchase link.\n\n" +
      "Please try again from our website or contact support if the issue persists."
  }
}