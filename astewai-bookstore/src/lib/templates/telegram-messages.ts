export interface PurchaseMessageData {
  itemTitle: string
  amountInBirr: number
  transactionReference: string
  paymentOptions: Array<{
    providerName: string
    accountNumber: string
    accountName: string
    instructions?: string
  }>
}

export interface AdminNotificationData {
  transactionReference: string
  userName: string
  userUsername?: string
  amountInBirr: number
  itemTitle: string
  date: string
}

export class TelegramMessageTemplates {
  static createPurchaseMessage(data: PurchaseMessageData): string {
    const paymentInstructions = this.getDefaultPaymentInstructions()
    
    let paymentOptionsText = ""
    data.paymentOptions.forEach((option, index) => {
      paymentOptionsText += `\n${index + 1}. **${option.providerName}**\n`
      paymentOptionsText += `   Account: ${option.accountNumber}\n`
      paymentOptionsText += `   Name: ${option.accountName}\n`
      if (option.instructions) {
        paymentOptionsText += `   📝 ${option.instructions}\n`
      }
      paymentOptionsText += "\n"
    })

    return `📚 **${data.itemTitle}**\n` +
      `💵 **Price:** ${data.amountInBirr} Birr\n\n` +
      `${paymentInstructions}\n\n` +
      `💳 **Payment Options:**${paymentOptionsText}` +
      `**Order ID:** ${data.transactionReference}\n\n` +
      `📱 **Commands:**\n` +
      `• /help - Show payment instructions again\n` +
      `• /orderstatus ${data.transactionReference} - Check order status\n\n` +
      `Need help? Contact our support team.`
  }

  static createAdminNotification(data: AdminNotificationData, type: 'screenshot' | 'text'): string {
    const typeLabel = type === 'screenshot' ? 'New Payment Screenshot Received' : 'New Payment Confirmation (Text)'
    
    return `🔔 **${typeLabel}**\n\n` +
      `**Order ID:** ${data.transactionReference}\n` +
      `**User:** ${data.userName} (@${data.userUsername || 'N/A'})\n` +
      `**Amount:** ${data.amountInBirr} Birr\n` +
      `**Book:** ${data.itemTitle}\n` +
      `**Date:** ${data.date}\n\n` +
      `**Commands:**\n` +
      `• /approve ${data.transactionReference}\n` +
      `• /reject ${data.transactionReference}`
  }

  static createPaymentConfirmationMessage(transactionReference: string): string {
    return `✅ **Payment Screenshot Received!**\n\n` +
      `Thank you for sending your payment confirmation. Our team will verify your transaction within 24 hours.\n\n` +
      `**Order ID:** ${transactionReference}\n\n` +
      `You'll receive a notification once your purchase is approved and the book is added to your library.\n\n` +
      `Questions? Contact our support team.`
  }

  static createOrderStatusMessage(purchase: any): string {
    const statusLabels = {
      'pending_initiation': '🟡 Pending - Waiting for payment initiation',
      'awaiting_payment': '🟠 Awaiting Payment - Please send payment and confirm',
      'pending_verification': '🔵 Under Review - We\'re verifying your payment',
      'completed': '✅ Completed - Book delivered to your library',
      'rejected': '❌ Rejected - Payment verification failed',
    }
    
    const statusLabel = statusLabels[purchase.status as keyof typeof statusLabels] || "❓ Unknown Status"
    
    return `📋 **Order Status**\n\n` +
      `**Order ID:** ${purchase.transaction_reference}\n` +
      `**Status:** ${statusLabel}\n` +
      `**Amount:** ${purchase.amount_in_birr} Birr\n` +
      `**Book:** ${purchase.item_title}\n` +
      `**Created:** ${new Date(purchase.created_at).toLocaleDateString()}\n\n` +
      `Need help? Contact our support team.`
  }

  static createWelcomeMessage(): string {
    return "Welcome to Astewai Digital Bookstore! 📚\n\n" +
      "To purchase a book, please use the purchase link from our website.\n\n" +
      "Available commands:\n" +
      "• /help - Show payment instructions\n" +
      "• /orderstatus [OrderID] - Check order status\n\n" +
      "Need help? Contact our support team."
  }

  static createHelpMessage(): string {
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

  private static getDefaultPaymentInstructions(): string {
    return `To purchase this book, please send your payment to one of the following accounts:

1. **Commercial Bank of Ethiopia** - [Account Number]
2. **Awash Bank** - [Account Number]  
3. **Telebirr** - [Account Number]

After payment, send your payment confirmation screenshot here.`
  }
}