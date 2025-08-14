/**
 * Payment Configuration Service
 * Manages bank account and mobile money payment configurations
 */

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const PaymentConfigTypeSchema = z.enum(['bank_account', 'mobile_money'])

const CreatePaymentConfigSchema = z.object({
  config_type: PaymentConfigTypeSchema,
  provider_name: z.string().min(1, 'Provider name is required').max(100),
  account_number: z.string().min(1, 'Account number is required').max(100),
  account_name: z.string().min(1, 'Account name is required').max(200),
  instructions: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  display_order: z.number().int().min(0).optional().default(0)
})

const UpdatePaymentConfigSchema = CreatePaymentConfigSchema.partial().omit({ config_type: true })

export interface PaymentConfig {
  id: string
  config_type: 'bank_account' | 'mobile_money'
  provider_name: string
  account_number: string
  account_name: string
  instructions: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface CreatePaymentConfigData {
  config_type: 'bank_account' | 'mobile_money'
  provider_name: string
  account_number: string
  account_name: string
  instructions?: string
  is_active?: boolean
  display_order?: number
}

export interface UpdatePaymentConfigData {
  provider_name?: string
  account_number?: string
  account_name?: string
  instructions?: string
  is_active?: boolean
  display_order?: number
}

export interface PaymentInstruction {
  id: string
  type: 'bank_account' | 'mobile_money'
  provider: string
  accountNumber: string
  accountName: string
  instructions: string
  displayOrder: number
}

// Generic result type for consistent error handling
export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class PaymentConfigService {
  private readonly logger = {
    error: (message: string, error?: any) => {
      console.error(`[PaymentConfigService] ${message}`, error)
    },
    info: (message: string, data?: any) => {
      console.info(`[PaymentConfigService] ${message}`, data)
    }
  }

  /**
   * Get all active payment methods for display to users
   */
  async getActivePaymentMethods(): Promise<ServiceResult<PaymentInstruction[]>> {
    try {
      const supabase = await createClient()
      
      const { data: configs, error } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        this.logger.error('Error fetching active payment methods', error)
        return { success: false, error: error.message }
      }

      // Transform to PaymentInstruction format
      const instructions: PaymentInstruction[] = (configs || []).map(config => ({
        id: config.id,
        type: config.config_type,
        provider: config.provider_name,
        accountNumber: config.account_number,
        accountName: config.account_name,
        instructions: config.instructions || '',
        displayOrder: config.display_order
      }))

      this.logger.info(`Retrieved ${instructions.length} active payment methods`)
      return { success: true, data: instructions }
    } catch (error) {
      this.logger.error('Error in getActivePaymentMethods', error)
      return { success: false, error: 'Failed to fetch payment methods' }
    }
  }

  /**
   * Get all payment configurations (admin only)
   */
  async getAllPaymentConfigs(): Promise<ServiceResult<PaymentConfig[]>> {
    try {
      const supabase = await createClient()
      
      const { data: configs, error } = await supabase
        .from('payment_config')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        this.logger.error('Error fetching all payment configs', error)
        return { success: false, error: error.message }
      }

      this.logger.info(`Retrieved ${configs?.length || 0} payment configurations`)
      return { success: true, data: configs || [] }
    } catch (error) {
      this.logger.error('Error in getAllPaymentConfigs', error)
      return { success: false, error: 'Failed to fetch payment configurations' }
    }
  }

  /**
   * Create a new payment configuration (admin only)
   */
  async createPaymentConfig(data: CreatePaymentConfigData): Promise<ServiceResult<PaymentConfig>> {
    try {
      // Validate input data
      const validationResult = CreatePaymentConfigSchema.safeParse(data)
      if (!validationResult.success) {
        const errorMessage = `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        this.logger.error('Validation failed for createPaymentConfig', validationResult.error)
        return { success: false, error: errorMessage }
      }

      const supabase = await createClient()
      const configData = validationResult.data

      const { data: config, error } = await supabase
        .from('payment_config')
        .insert(configData)
        .select()
        .single()

      if (error) {
        this.logger.error('Error creating payment config', error)
        return { success: false, error: error.message }
      }

      this.logger.info('Payment configuration created successfully', { id: config.id, type: config.config_type })
      return { success: true, data: config }
    } catch (error) {
      this.logger.error('Error in createPaymentConfig', error)
      return { success: false, error: 'Failed to create payment configuration' }
    }
  }

  /**
   * Update a payment configuration (admin only)
   */
  async updatePaymentConfig(id: string, data: UpdatePaymentConfigData): Promise<ServiceResult<PaymentConfig>> {
    try {
      // Validate input data
      const validationResult = UpdatePaymentConfigSchema.safeParse(data)
      if (!validationResult.success) {
        const errorMessage = `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        this.logger.error('Validation failed for updatePaymentConfig', validationResult.error)
        return { success: false, error: errorMessage }
      }

      // Validate ID format
      if (!id || typeof id !== 'string') {
        this.logger.error('Invalid payment configuration ID provided', { id })
        return { success: false, error: 'Invalid payment configuration ID' }
      }

      const supabase = await createClient()
      
      const { data: config, error } = await supabase
        .from('payment_config')
        .update(validationResult.data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.logger.error('Error updating payment config', error)
        return { success: false, error: error.message }
      }

      this.logger.info('Payment configuration updated successfully', { id })
      return { success: true, data: config }
    } catch (error) {
      this.logger.error('Error in updatePaymentConfig', error)
      return { success: false, error: 'Failed to update payment configuration' }
    }
  }

  /**
   * Delete a payment configuration (admin only)
   */
  async deletePaymentConfig(id: string): Promise<ServiceResult<void>> {
    try {
      if (!id || typeof id !== 'string') {
        this.logger.error('Invalid payment configuration ID provided for deletion', { id })
        return { success: false, error: 'Invalid payment configuration ID' }
      }

      const supabase = await createClient()
      
      const { error } = await supabase
        .from('payment_config')
        .delete()
        .eq('id', id)

      if (error) {
        this.logger.error('Error deleting payment config', error)
        return { success: false, error: error.message }
      }

      this.logger.info('Payment configuration deleted successfully', { id })
      return { success: true }
    } catch (error) {
      this.logger.error('Error in deletePaymentConfig', error)
      return { success: false, error: 'Failed to delete payment configuration' }
    }
  }

  /**
   * Toggle payment configuration active status (admin only)
   */
  async togglePaymentConfigStatus(id: string): Promise<ServiceResult<PaymentConfig>> {
    try {
      if (!id || typeof id !== 'string') {
        this.logger.error('Invalid payment configuration ID provided for toggle', { id })
        return { success: false, error: 'Invalid payment configuration ID' }
      }

      const supabase = await createClient()
      
      // First get current status
      const { data: currentConfig, error: fetchError } = await supabase
        .from('payment_config')
        .select('is_active')
        .eq('id', id)
        .single()

      if (fetchError) {
        this.logger.error('Error fetching current config for toggle', fetchError)
        return { success: false, error: fetchError.message }
      }

      // Toggle the status
      const newStatus = !currentConfig.is_active
      const { data: config, error } = await supabase
        .from('payment_config')
        .update({ is_active: newStatus })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        this.logger.error('Error toggling payment config status', error)
        return { success: false, error: error.message }
      }

      this.logger.info('Payment configuration status toggled', { id, newStatus })
      return { success: true, data: config }
    } catch (error) {
      this.logger.error('Error in togglePaymentConfigStatus', error)
      return { success: false, error: 'Failed to toggle payment configuration status' }
    }
  }

  /**
   * Get payment instructions formatted as text for Telegram bot
   */
  async getPaymentInstructionsText(): Promise<string> {
    try {
      const result = await this.getActivePaymentMethods()
      if (!result.success || !result.data) {
        return 'Payment instructions are currently unavailable. Please contact support.'
      }

      const instructions = result.data
      if (instructions.length === 0) {
        return 'No payment methods are currently available. Please contact support.'
      }

      let text = '💳 **Payment Instructions**\n\n'
      
      instructions.forEach((instruction, index) => {
        const emoji = instruction.type === 'bank_account' ? '🏦' : '📱'
        text += `${emoji} **${instruction.provider}**\n`
        text += `Account: ${instruction.accountNumber}\n`
        text += `Name: ${instruction.accountName}\n`
        
        if (instruction.instructions) {
          text += `${instruction.instructions}\n`
        }
        
        if (index < instructions.length - 1) {
          text += '\n'
        }
      })

      text += '\n⚠️ **Important**: Please include your transaction reference in the payment description!'
      
      return text
    } catch (error) {
      this.logger.error('Error generating payment instructions text', error)
      return 'Error loading payment instructions. Please contact support.'
    }
  }

  /**
   * Reorder payment configurations (admin only)
   */
  async reorderPaymentConfigs(configIds: string[]): Promise<ServiceResult<void>> {
    try {
      if (!Array.isArray(configIds) || configIds.length === 0) {
        this.logger.error('Invalid config IDs provided for reordering', { configIds })
        return { success: false, error: 'Invalid configuration IDs array' }
      }

      // Validate all IDs are strings
      const invalidIds = configIds.filter(id => !id || typeof id !== 'string')
      if (invalidIds.length > 0) {
        this.logger.error('Invalid ID format in reorder request', { invalidIds })
        return { success: false, error: 'All configuration IDs must be valid strings' }
      }

      const supabase = await createClient()
      
      // Update display_order for each config
      const updates = configIds.map((id, index) => 
        supabase
          .from('payment_config')
          .update({ display_order: index })
          .eq('id', id)
      )

      const results = await Promise.all(updates)
      
      // Check if any updates failed
      const failedUpdate = results.find(result => result.error)
      if (failedUpdate) {
        this.logger.error('Error reordering payment configs', failedUpdate.error)
        return { success: false, error: failedUpdate.error.message }
      }

      this.logger.info('Payment configurations reordered successfully', { count: configIds.length })
      return { success: true }
    } catch (error) {
      this.logger.error('Error in reorderPaymentConfigs', error)
      return { success: false, error: 'Failed to reorder payment configurations' }
    }
  }
}

// Export singleton instance for consistent usage
export const paymentConfigService = new PaymentConfigService()

// Also export class for testing
export { PaymentConfigService }