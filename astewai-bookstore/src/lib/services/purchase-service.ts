import { createClient } from '@/lib/supabase/server'
import { PURCHASE_STATUS } from '@/lib/constants/purchase-status'

export interface PurchaseInfo {
  id: string
  itemTitle: string
  itemType: 'book' | 'bundle'
  itemId: string
  amount: number
  amountInBirr: number
  transactionReference: string
}

export interface BasePurchaseData {
  user_id: string
  item_type: 'book' | 'bundle'
  item_id: string
  amount: number
  status: string
  created_at: string
}

export interface TelegramPurchaseCreateData extends BasePurchaseData {
  amount_in_birr: number
  initiation_token: string
  transaction_reference: string
  telegram_chat_id?: number
  telegram_user_id?: number
}

export interface TelegramPurchaseData extends BasePurchaseData {
  amount_in_birr: number
  initiation_token: string
  transaction_reference: string
}

export interface PaymentOption {
  providerName: string
  accountNumber: string
  accountName: string
  instructions?: string
}

export interface InitiateTelegramPurchaseParams {
  userId: string
  itemType: 'book' | 'bundle'
  itemId: string
  amount: number
}

export interface InitiateTelegramPurchaseResult {
  success: boolean
  data?: {
    purchaseId: string
    telegramUrl: string
    transactionReference: string
  }
  error?: string
}

export class PurchaseService {
  private async getSupabaseClient() {
    return await createClient()
  }

  /**
   * Validates if an item exists and returns its details
   */
  private async validateItem(itemType: 'book' | 'bundle', itemId: string): Promise<{ success: boolean; data?: { title: string; price: number }; error?: string }> {
    try {
      const supabase = await this.getSupabaseClient()
      const table = itemType === 'book' ? 'books' : 'bundles'
      
      const { data, error } = await supabase
        .from(table)
        .select('title, price')
        .eq('id', itemId)
        .single()

      if (error || !data) {
        return { success: false, error: `${itemType} not found` }
      }

      return { success: true, data: { title: data.title, price: data.price } }
    } catch (error) {
      return { success: false, error: `Error validating ${itemType}: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  /**
   * Generates a unique transaction reference
   */
  private generateTransactionReference(): string {
    const timestamp = Date.now()
    const randomPart = this.generateSecureRandomString(9).toUpperCase()
    return `AST-${timestamp}-${randomPart}`
  }

  /**
   * Generates a unique initiation token for Telegram
   */
  private generateInitiationToken(): string {
    const timestamp = Date.now()
    const randomPart = this.generateSecureRandomString(16)
    return `tg_${timestamp}_${randomPart}`
  }

  /**
   * Generates a cryptographically secure random string
   */
  private generateSecureRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    // Use crypto.getRandomValues for better security
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
    }
    
    return result
  }

  /**
   * Creates Telegram bot URL with initiation token
   */
  private generateTelegramUrl(initiationToken: string): string {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'astewaibot'
    return `https://t.me/${botUsername}?start=${initiationToken}`
  }

  async getPurchaseByToken(token: string): Promise<{ purchase: PurchaseInfo; paymentOptions: PaymentOption[] } | null> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Direct database query instead of HTTP call for better performance
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('initiation_token', token)
        .eq('status', PURCHASE_STATUS.PENDING_INITIATION)
        .single()

      if (purchaseError || !purchase) {
        console.error('Purchase not found or expired:', purchaseError)
        return null
      }

      // Get payment options
      const { data: paymentOptions, error: paymentError } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at')

      if (paymentError) {
        console.error('Error fetching payment options:', paymentError)
        return null
      }

      // Get item title based on type
      let itemTitle = 'Unknown Item'
      if (purchase.item_type === 'book') {
        const { data: book } = await supabase
          .from('books')
          .select('title')
          .eq('id', purchase.item_id)
          .single()
        itemTitle = book?.title || 'Unknown Book'
      } else if (purchase.item_type === 'bundle') {
        const { data: bundle } = await supabase
          .from('bundles')
          .select('title')
          .eq('id', purchase.item_id)
          .single()
        itemTitle = bundle?.title || 'Unknown Bundle'
      }

      return {
        purchase: {
          id: purchase.id,
          itemId: purchase.item_id,
          itemType: purchase.item_type,
          itemTitle,
          amount: purchase.amount,
          amountInBirr: purchase.amount_in_birr || purchase.amount,
          transactionReference: purchase.transaction_reference
        },
        paymentOptions: paymentOptions?.map(option => ({
          providerName: option.provider_name,
          accountNumber: option.account_number,
          accountName: option.account_name,
          instructions: option.instructions
        })) || []
      }
    } catch (error) {
      console.error('Error fetching purchase info:', error)
      return null
    }
  }

  async initiateTelegramPurchase(params: InitiateTelegramPurchaseParams): Promise<InitiateTelegramPurchaseResult> {
    try {
      const { userId, itemType, itemId, amount } = params

      // Input validation
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: 'Invalid user ID' }
      }
      
      if (!itemType || !['book', 'bundle'].includes(itemType)) {
        return { success: false, error: 'Invalid item type' }
      }
      
      if (!itemId || typeof itemId !== 'string') {
        return { success: false, error: 'Invalid item ID' }
      }
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return { success: false, error: 'Invalid amount' }
      }

      console.log('🚀 Received purchase request:', { itemType, itemId, amount, userId })

      // Validate item exists
      const itemValidation = await this.validateItem(itemType, itemId)
      if (!itemValidation.success) {
        return { success: false, error: itemValidation.error }
      }

      // Generate tokens
      const transactionReference = this.generateTransactionReference()
      const initiationToken = this.generateInitiationToken()

      // Create ONLY the basic purchase data that exists in the database
      const purchaseData = {
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        amount: amount,
        status: PURCHASE_STATUS.PENDING_INITIATION,
        created_at: new Date().toISOString()
      }

      console.log('📝 Creating purchase with BASIC data only:', JSON.stringify(purchaseData, null, 2))

      // Insert purchase directly
      const supabase = await this.getSupabaseClient()
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single()
      
      if (purchaseError || !purchase) {
        console.error('❌ Error creating purchase:', purchaseError)
        return { 
          success: false, 
          error: `Database error: ${purchaseError?.message || 'Unknown error'}. Please run the database migration from URGENT_DATABASE_FIX.md` 
        }
      }

      console.log('✅ Purchase created successfully:', purchase.id)

      // Generate Telegram URL
      const telegramUrl = this.generateTelegramUrl(initiationToken)

      return {
        success: true,
        data: {
          purchaseId: purchase.id,
          telegramUrl,
          transactionReference
        }
      }

    } catch (error) {
      console.error('❌ Error in initiateTelegramPurchase:', error)
      return { 
        success: false, 
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  async updatePurchaseWithTelegram(
    purchaseId: string, 
    chatId: number, 
    userId: number
  ): Promise<void> {
    const supabase = await this.getSupabaseClient()
    await supabase
      .from('purchases')
      .update({
        telegram_chat_id: chatId,
        telegram_user_id: userId,
        status: PURCHASE_STATUS.AWAITING_PAYMENT
      })
      .eq('id', purchaseId)
  }

  async findPendingPurchase(chatId: number) {
    const supabase = await this.getSupabaseClient()
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .eq('status', PURCHASE_STATUS.AWAITING_PAYMENT)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !purchases || purchases.length === 0) {
      return null
    }

    return purchases[0]
  }

  async updatePurchaseStatus(purchaseId: string, status: string): Promise<void> {
    const supabase = await this.getSupabaseClient()
    await supabase
      .from('purchases')
      .update({ status })
      .eq('id', purchaseId)
  }

  async findPurchaseByOrderId(orderId: string, chatId: number) {
    const supabase = await this.getSupabaseClient()
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('transaction_reference', orderId)
      .eq('telegram_chat_id', chatId)
      .single()

    if (error || !purchases) {
      return null
    }

    return purchases
  }
}

// Export a singleton instance for convenience
export const purchaseService = new PurchaseService()