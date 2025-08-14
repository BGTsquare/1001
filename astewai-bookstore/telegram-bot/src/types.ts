export interface Purchase {
  purchase_id: string
  user_id: string
  user_email: string
  user_name: string
  item_type: 'book' | 'bundle'
  item_id: string
  item_title: string
  amount: number
  status: string
  transaction_reference: string
  created_at: string
}

export interface PaymentConfig {
  id: string
  config_type: 'bank_account' | 'mobile_money'
  provider_name: string
  account_number: string
  account_name: string
  instructions: string
  is_active: boolean
  display_order: number
}

export interface TelegramUserData {
  chat_id: number
  user_id: number
  username?: string
  first_name?: string
  last_name?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PurchaseFinalizationData {
  purchase: Purchase
  user: {
    email: string
    name: string
  }
  item: {
    title: string
    type: string
  }
}