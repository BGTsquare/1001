/**
 * Payment Repository - New Simplified Payment System
 */

import { createClient } from '@/lib/supabase/server'
import type { 
  PaymentRequest, 
  PaymentRequestWithDetails,
  CreatePaymentRequestData, 
  UpdatePaymentRequestData,
  PaymentVerificationLog,
  WalletConfig,
  AutoMatchingRule,
  PaymentFilters,
  PaymentSortOptions,
  PaginationOptions,
  PaymentListResponse,
  PaymentStats,
  ApiResponse
} from '@/lib/types/payment'

export class PaymentRepository {
  private async getSupabaseClient() {
    return await createClient()
  }

  /**
   * Call DB RPC to grant purchased items to user after completion (security definer function)
   */
  async grantPurchaseToUser(paymentRequestId: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = await this.getSupabaseClient()
      const { error } = await supabase.rpc('grant_purchase_to_user', { p_payment_request_id: paymentRequestId })
      if (error) {
        console.error('Error calling grant_purchase_to_user RPC:', error)
        return { success: false, error: error.message }
      }
      return { success: true, data: true }
    } catch (error) {
      console.error('Error in grantPurchaseToUser:', error)
      return { success: false, error: 'Failed to grant purchase' }
    }
  }

  /**
   * Create a new payment request
   */
  async createPaymentRequest(data: CreatePaymentRequestData & { user_id: string }): Promise<ApiResponse<PaymentRequest>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: paymentRequest, error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: data.user_id,
          item_type: data.item_type,
          item_id: data.item_id,
          amount: data.amount,
          currency: data.currency || 'ETB',
          selected_wallet_id: data.selected_wallet_id,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating payment request:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: paymentRequest }
    } catch (error) {
      console.error('Error in createPaymentRequest:', error)
      return { success: false, error: 'Failed to create payment request' }
    }
  }

  /**
   * Get payment request by ID with related data
   */
  async getPaymentRequestById(id: string): Promise<ApiResponse<PaymentRequestWithDetails>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: paymentRequest, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          wallet_config:wallet_config(*),
          verification_logs:payment_verification_logs(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching payment request:', error)
        return { success: false, error: error.message }
      }

      // Get item title
      let itemTitle = 'Unknown Item'
      if (paymentRequest.item_type === 'book') {
        const { data: book } = await supabase
          .from('books')
          .select('title')
          .eq('id', paymentRequest.item_id)
          .single()
        itemTitle = book?.title || 'Unknown Book'
      } else if (paymentRequest.item_type === 'bundle') {
        const { data: bundle } = await supabase
          .from('bundles')
          .select('title')
          .eq('id', paymentRequest.item_id)
          .single()
        itemTitle = bundle?.title || 'Unknown Bundle'
      }

      // Get user info
      const { data: user } = await supabase.auth.admin.getUserById(paymentRequest.user_id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', paymentRequest.user_id)
        .single()

      const paymentRequestWithDetails: PaymentRequestWithDetails = {
        ...paymentRequest,
        item_title: itemTitle,
        user_email: user.user?.email || 'Unknown',
        user_name: profile?.display_name || 'User'
      }

      return { success: true, data: paymentRequestWithDetails }
    } catch (error) {
      console.error('Error in getPaymentRequestById:', error)
      return { success: false, error: 'Failed to fetch payment request' }
    }
  }

  /**
   * Update payment request
   */
  async updatePaymentRequest(id: string, data: UpdatePaymentRequestData): Promise<ApiResponse<PaymentRequest>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: paymentRequest, error } = await supabase
        .from('payment_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating payment request:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: paymentRequest }
    } catch (error) {
      console.error('Error in updatePaymentRequest:', error)
      return { success: false, error: 'Failed to update payment request' }
    }
  }

  /**
   * Get payment requests with filtering, sorting, and pagination
   */
  async getPaymentRequests(
    filters: PaymentFilters = {},
    sort: PaymentSortOptions = { sort_by: 'created_at', sort_order: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<ApiResponse<PaymentListResponse>> {
    try {
      const supabase = await this.getSupabaseClient()
      const offset = (pagination.page - 1) * pagination.limit

      let query = supabase
        .from('payment_requests')
        .select(`
          *,
          wallet_config:wallet_config(*)
        `, { count: 'exact' })

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.wallet_type && filters.wallet_type.length > 0) {
        query = query.in('wallet_config.wallet_type', filters.wallet_type)
      }

      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range[0].toISOString())
          .lte('created_at', filters.date_range[1].toISOString())
      }

      if (filters.amount_range) {
        query = query
          .gte('amount', filters.amount_range[0])
          .lte('amount', filters.amount_range[1])
      }

      if (filters.auto_matched !== undefined) {
        if (filters.auto_matched) {
          query = query.not('auto_matched_at', 'is', null)
        } else {
          query = query.is('auto_matched_at', null)
        }
      }

      if (filters.search_query) {
        query = query.or(`manual_tx_id.ilike.%${filters.search_query}%,ocr_extracted_tx_id.ilike.%${filters.search_query}%`)
      }

      // Apply sorting
      query = query.order(sort.sort_by, { ascending: sort.sort_order === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + pagination.limit - 1)

      const { data: paymentRequests, error, count } = await query

      if (error) {
        console.error('Error fetching payment requests:', error)
        return { success: false, error: error.message }
      }

      // Get item titles and user info for each request
      const paymentRequestsWithDetails = await Promise.all(
        (paymentRequests || []).map(async (request) => {
          let itemTitle = 'Unknown Item'
          if (request.item_type === 'book') {
            const { data: book } = await supabase
              .from('books')
              .select('title')
              .eq('id', request.item_id)
              .single()
            itemTitle = book?.title || 'Unknown Book'
          } else if (request.item_type === 'bundle') {
            const { data: bundle } = await supabase
              .from('bundles')
              .select('title')
              .eq('id', request.item_id)
              .single()
            itemTitle = bundle?.title || 'Unknown Bundle'
          }

          const { data: user } = await supabase.auth.admin.getUserById(request.user_id)
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', request.user_id)
            .single()

          return {
            ...request,
            item_title: itemTitle,
            user_email: user.user?.email || 'Unknown',
            user_name: profile?.display_name || 'User'
          } as PaymentRequestWithDetails
        })
      )

      const response: PaymentListResponse = {
        data: paymentRequestsWithDetails,
        total: count || 0,
        page: pagination.page,
        limit: pagination.limit,
        has_more: (count || 0) > offset + pagination.limit
      }

      return { success: true, data: response }
    } catch (error) {
      console.error('Error in getPaymentRequests:', error)
      return { success: false, error: 'Failed to fetch payment requests' }
    }
  }

  /**
   * Get user's payment requests
   */
  async getUserPaymentRequests(userId: string, limit: number = 20): Promise<ApiResponse<PaymentRequest[]>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: paymentRequests, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user payment requests:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: paymentRequests || [] }
    } catch (error) {
      console.error('Error in getUserPaymentRequests:', error)
      return { success: false, error: 'Failed to fetch user payment requests' }
    }
  }

  /**
   * Get active wallet configurations
   */
  async getActiveWalletConfigs(): Promise<ApiResponse<WalletConfig[]>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: wallets, error } = await supabase
        .from('wallet_config')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error fetching wallet configs:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: wallets || [] }
    } catch (error) {
      console.error('Error in getActiveWalletConfigs:', error)
      return { success: false, error: 'Failed to fetch wallet configurations' }
    }
  }

  /**
   * Get all wallet configurations (admin only)
   */
  async getAllWalletConfigs(): Promise<ApiResponse<WalletConfig[]>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: wallets, error } = await supabase
        .from('wallet_config')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error fetching all wallet configs:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: wallets || [] }
    } catch (error) {
      console.error('Error in getAllWalletConfigs:', error)
      return { success: false, error: 'Failed to fetch wallet configurations' }
    }
  }

  /**
   * Get auto-matching rules
   */
  async getAutoMatchingRules(): Promise<ApiResponse<AutoMatchingRule[]>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: rules, error } = await supabase
        .from('auto_matching_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) {
        console.error('Error fetching auto-matching rules:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: rules || [] }
    } catch (error) {
      console.error('Error in getAutoMatchingRules:', error)
      return { success: false, error: 'Failed to fetch auto-matching rules' }
    }
  }

  /**
   * Add verification log entry
   */
  async addVerificationLog(
    paymentRequestId: string,
    verificationType: string,
    status: 'success' | 'failed' | 'pending',
    details?: Record<string, any>,
    errorMessage?: string,
    processedBy?: string
  ): Promise<ApiResponse<PaymentVerificationLog>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: log, error } = await supabase
        .from('payment_verification_logs')
        .insert({
          payment_request_id: paymentRequestId,
          verification_type: verificationType,
          status,
          details,
          error_message: errorMessage,
          processed_by: processedBy
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding verification log:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: log }
    } catch (error) {
      console.error('Error in addVerificationLog:', error)
      return { success: false, error: 'Failed to add verification log' }
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<ApiResponse<PaymentStats>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Get basic counts
      const { data: statusCounts, error: statusError } = await supabase
        .from('payment_requests')
        .select('status')

      if (statusError) {
        console.error('Error fetching status counts:', statusError)
        return { success: false, error: statusError.message }
      }

      const counts = statusCounts?.reduce((acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Get auto-matched count
      const { count: autoMatchedCount, error: autoMatchedError } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .not('auto_matched_at', 'is', null)

      if (autoMatchedError) {
        console.error('Error fetching auto-matched count:', autoMatchedError)
        return { success: false, error: autoMatchedError.message }
      }

      // Get manual verified count
      const { count: manualVerifiedCount, error: manualVerifiedError } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .not('admin_verified_at', 'is', null)

      if (manualVerifiedError) {
        console.error('Error fetching manual verified count:', manualVerifiedError)
        return { success: false, error: manualVerifiedError.message }
      }

      // Get total amount
      const { data: amountData, error: amountError } = await supabase
        .from('payment_requests')
        .select('amount')
        .eq('status', 'completed')

      if (amountError) {
        console.error('Error fetching total amount:', amountError)
        return { success: false, error: amountError.message }
      }

      const totalAmount = amountData?.reduce((sum, request) => sum + request.amount, 0) || 0

      // Calculate average processing time (simplified)
      const { data: completedRequests, error: completedError } = await supabase
        .from('payment_requests')
        .select('created_at, admin_verified_at, auto_matched_at')
        .eq('status', 'completed')
        .limit(100) // Sample for performance

      let averageProcessingTimeHours = 0
      if (completedRequests && completedRequests.length > 0) {
        const processingTimes = completedRequests
          .map(request => {
            const completedAt = request.admin_verified_at || request.auto_matched_at
            if (completedAt) {
              const start = new Date(request.created_at).getTime()
              const end = new Date(completedAt).getTime()
              return (end - start) / (1000 * 60 * 60) // Convert to hours
            }
            return 0
          })
          .filter(time => time > 0)

        if (processingTimes.length > 0) {
          averageProcessingTimeHours = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        }
      }

      const stats: PaymentStats = {
        total_requests: Object.values(counts).reduce((sum, count) => sum + count, 0),
        pending_requests: counts.pending || 0,
        completed_requests: counts.completed || 0,
        failed_requests: counts.failed || 0,
        auto_matched_requests: autoMatchedCount || 0,
        manual_verified_requests: manualVerifiedCount || 0,
        total_amount: totalAmount,
        average_processing_time_hours: averageProcessingTimeHours
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error in getPaymentStats:', error)
      return { success: false, error: 'Failed to fetch payment statistics' }
    }
  }

  /**
   * Check if user has existing payment request for item
   */
  async hasExistingPaymentRequest(
    userId: string, 
    itemType: 'book' | 'bundle', 
    itemId: string
  ): Promise<ApiResponse<PaymentRequest | null>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data: paymentRequest, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .in('status', ['pending', 'payment_initiated', 'payment_verified'])
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing payment request:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: paymentRequest || null }
    } catch (error) {
      console.error('Error in hasExistingPaymentRequest:', error)
      return { success: false, error: 'Failed to check existing payment request' }
    }
  }

  /**
   * Delete payment request (admin only)
   */
  async deletePaymentRequest(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { error } = await supabase
        .from('payment_requests')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting payment request:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: true }
    } catch (error) {
      console.error('Error in deletePaymentRequest:', error)
      return { success: false, error: 'Failed to delete payment request' }
    }
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository()


