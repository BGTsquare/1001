/**
 * Auto-Matching Service for Payment Verification
 * Implements intelligent rules-based payment matching
 */

import { paymentRepository } from '@/lib/repositories/payment-repository'
import type { 
  PaymentRequest, 
  AutoMatchingRule, 
  AutoMatchResult,
  PaymentVerificationLog 
} from '@/lib/types/payment'

export interface MatchingContext {
  paymentRequest: PaymentRequest
  userHistory: PaymentRequest[]
  timeWindow: number // minutes
  amountTolerance: number // percentage
}

export interface MatchingRule {
  id: string
  name: string
  type: 'amount_match' | 'tx_id_pattern' | 'time_window' | 'user_history'
  conditions: Record<string, any>
  confidence: number
  priority: number
}

export class AutoMatchingService {
  private rules: AutoMatchingRule[] = []
  private isInitialized = false

  /**
   * Initialize the service with rules from database
   */
  async initialize(): Promise<void> {
    try {
      const result = await paymentRepository.getAutoMatchingRules()
      if (result.success && result.data) {
        this.rules = result.data
        this.isInitialized = true
        console.log(`Auto-matching service initialized with ${this.rules.length} rules`)
      } else {
        console.error('Failed to initialize auto-matching rules:', result.error)
        this.isInitialized = false
      }
    } catch (error) {
      console.error('Error initializing auto-matching service:', error)
      this.isInitialized = false
    }
  }

  /**
   * Process auto-matching for a payment request
   */
  async processAutoMatching(paymentRequestId: string): Promise<AutoMatchResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Get payment request details
      const paymentResult = await paymentRepository.getPaymentRequestById(paymentRequestId)
      if (!paymentResult.success || !paymentResult.data) {
        return {
          matched: false,
          confidence: 0,
          reason: 'Payment request not found'
        }
      }

      const paymentRequest = paymentResult.data

      // Skip if already processed
      if (paymentRequest.auto_matched_at) {
        return {
          matched: true,
          confidence: paymentRequest.auto_match_confidence || 0,
          reason: 'Already auto-matched'
        }
      }

      // Get user history for context
      const userHistoryResult = await paymentRepository.getUserPaymentRequests(
        paymentRequest.user_id, 
        50 // Get last 50 requests
      )
      const userHistory = userHistoryResult.success ? userHistoryResult.data || [] : []

      const context: MatchingContext = {
        paymentRequest,
        userHistory,
        timeWindow: 30, // 30 minutes default
        amountTolerance: 5 // 5% default
      }

      // Apply matching rules
      const matchResult = await this.applyMatchingRules(context)

      // Log the matching attempt
      await this.logMatchingAttempt(paymentRequestId, matchResult)

      // Update payment request if matched
      if (matchResult.matched) {
        await this.updatePaymentRequestWithMatch(paymentRequestId, matchResult)
      }

      return matchResult

    } catch (error) {
      console.error('Error in processAutoMatching:', error)
      return {
        matched: false,
        confidence: 0,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Apply all matching rules to determine if payment should be auto-approved
   */
  private async applyMatchingRules(context: MatchingContext): Promise<AutoMatchResult> {
    let bestMatch: AutoMatchResult = {
      matched: false,
      confidence: 0
    }

    // Sort rules by priority (higher priority first)
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority)

    for (const rule of sortedRules) {
      if (!rule.is_active) continue

      const ruleResult = await this.applyRule(rule, context)
      
      if (ruleResult.matched && ruleResult.confidence > bestMatch.confidence) {
        bestMatch = {
          ...ruleResult,
          rule_id: rule.id,
          reason: `${rule.rule_name}: ${ruleResult.reason}`
        }
      }
    }

    // Check if best match meets confidence threshold
    const minConfidence = 0.7 // Default minimum confidence
    if (bestMatch.confidence >= minConfidence) {
      bestMatch.matched = true
    } else {
      bestMatch.matched = false
      bestMatch.reason = `Confidence ${bestMatch.confidence.toFixed(2)} below threshold ${minConfidence}`
    }

    return bestMatch
  }

  /**
   * Apply a single matching rule
   */
  private async applyRule(rule: AutoMatchingRule, context: MatchingContext): Promise<AutoMatchResult> {
    const { paymentRequest } = context

    switch (rule.rule_type) {
      case 'amount_match':
        return this.applyAmountMatchRule(rule, context)
      
      case 'tx_id_pattern':
        return this.applyTxIdPatternRule(rule, context)
      
      case 'time_window':
        return this.applyTimeWindowRule(rule, context)
      
      case 'user_history':
        return this.applyUserHistoryRule(rule, context)
      
      default:
        return {
          matched: false,
          confidence: 0,
          reason: `Unknown rule type: ${rule.rule_type}`
        }
    }
  }

  /**
   * Apply amount matching rule
   */
  private applyAmountMatchRule(rule: AutoMatchingRule, context: MatchingContext): AutoMatchResult {
    const { paymentRequest } = context
    const { conditions } = rule

    // Check if we have manual amount
    if (!paymentRequest.manual_amount) {
      return {
        matched: false,
        confidence: 0,
        reason: 'No manual amount provided'
      }
    }

    // Check if we have OCR extracted amount
    const amountToCheck = paymentRequest.ocr_extracted_amount || paymentRequest.manual_amount
    const expectedAmount = paymentRequest.amount
    const tolerance = conditions.tolerance_percentage || 5

    const difference = Math.abs(amountToCheck - expectedAmount)
    const percentageDifference = (difference / expectedAmount) * 100

    if (percentageDifference <= tolerance) {
      const confidence = this.calculateAmountMatchConfidence(percentageDifference, conditions)
      return {
        matched: true,
        confidence,
        reason: `Amount match: ${amountToCheck} vs ${expectedAmount} (${percentageDifference.toFixed(1)}% difference)`
      }
    }

    return {
      matched: false,
      confidence: 0,
      reason: `Amount mismatch: ${amountToCheck} vs ${expectedAmount} (${percentageDifference.toFixed(1)}% difference)`
    }
  }

  /**
   * Apply TX ID pattern matching rule
   */
  private applyTxIdPatternRule(rule: AutoMatchingRule, context: MatchingContext): AutoMatchResult {
    const { paymentRequest } = context
    const { conditions } = rule

    const txId = paymentRequest.manual_tx_id || paymentRequest.ocr_extracted_tx_id
    if (!txId) {
      return {
        matched: false,
        confidence: 0,
        reason: 'No transaction ID provided'
      }
    }

    const pattern = conditions.pattern
    if (!pattern) {
      return {
        matched: false,
        confidence: 0,
        reason: 'No pattern defined in rule'
      }
    }

    try {
      const regex = new RegExp(pattern, 'i')
      if (regex.test(txId)) {
        const confidence = conditions.base_confidence || 0.7
        return {
          matched: true,
          confidence,
          reason: `TX ID pattern match: ${txId} matches ${pattern}`
        }
      }
    } catch (error) {
      return {
        matched: false,
        confidence: 0,
        reason: `Invalid regex pattern: ${pattern}`
      }
    }

    return {
      matched: false,
      confidence: 0,
      reason: `TX ID pattern mismatch: ${txId} does not match ${pattern}`
    }
  }

  /**
   * Apply time window matching rule
   */
  private applyTimeWindowRule(rule: AutoMatchingRule, context: MatchingContext): AutoMatchResult {
    const { paymentRequest } = context
    const { conditions } = rule

    if (!paymentRequest.deep_link_clicked_at) {
      return {
        matched: false,
        confidence: 0,
        reason: 'No deep link click timestamp'
      }
    }

    const maxMinutes = conditions.max_minutes || 30
    const clickedAt = new Date(paymentRequest.deep_link_clicked_at)
    const now = new Date()
    const minutesElapsed = (now.getTime() - clickedAt.getTime()) / (1000 * 60)

    if (minutesElapsed <= maxMinutes) {
      // Check if TX ID was provided
      const hasTxId = !!(paymentRequest.manual_tx_id || paymentRequest.ocr_extracted_tx_id)
      
      if (hasTxId) {
        const confidence = this.calculateTimeWindowConfidence(minutesElapsed, maxMinutes, conditions)
        return {
          matched: true,
          confidence,
          reason: `Time window match: ${minutesElapsed.toFixed(1)} minutes elapsed, TX ID provided`
        }
      }
    }

    return {
      matched: false,
      confidence: 0,
      reason: `Time window exceeded: ${minutesElapsed.toFixed(1)} minutes > ${maxMinutes} minutes`
    }
  }

  /**
   * Apply user history matching rule
   */
  private applyUserHistoryRule(rule: AutoMatchingRule, context: MatchingContext): AutoMatchResult {
    const { userHistory } = context
    const { conditions } = rule

    // Check if user has completed payments before
    const completedPayments = userHistory.filter(p => p.status === 'completed')
    
    if (completedPayments.length > 0) {
      const confidence = conditions.base_confidence || 0.5
      return {
        matched: true,
        confidence,
        reason: `Returning user: ${completedPayments.length} previous completed payments`
      }
    }

    return {
      matched: false,
      confidence: 0,
      reason: 'New user: no previous completed payments'
    }
  }

  /**
   * Calculate confidence score for amount matching
   */
  private calculateAmountMatchConfidence(percentageDifference: number, conditions: any): number {
    const baseConfidence = conditions.base_confidence || 0.8
    const maxTolerance = conditions.tolerance_percentage || 5
    
    // Higher confidence for smaller differences
    const toleranceFactor = Math.max(0, (maxTolerance - percentageDifference) / maxTolerance)
    return baseConfidence * (0.5 + 0.5 * toleranceFactor)
  }

  /**
   * Calculate confidence score for time window matching
   */
  private calculateTimeWindowConfidence(minutesElapsed: number, maxMinutes: number, conditions: any): number {
    const baseConfidence = conditions.base_confidence || 0.6
    
    // Higher confidence for shorter time windows
    const timeFactor = Math.max(0, (maxMinutes - minutesElapsed) / maxMinutes)
    return baseConfidence * (0.3 + 0.7 * timeFactor)
  }

  /**
   * Log matching attempt
   */
  private async logMatchingAttempt(paymentRequestId: string, result: AutoMatchResult): Promise<void> {
    try {
      await paymentRepository.addVerificationLog(
        paymentRequestId,
        'auto_match',
        result.matched ? 'success' : 'failed',
        {
          confidence: result.confidence,
          rule_id: result.rule_id,
          reason: result.reason
        },
        result.matched ? undefined : result.reason
      )
    } catch (error) {
      console.error('Failed to log matching attempt:', error)
    }
  }

  /**
   * Update payment request with match result
   */
  private async updatePaymentRequestWithMatch(paymentRequestId: string, result: AutoMatchResult): Promise<void> {
    try {
      await paymentRepository.updatePaymentRequest(paymentRequestId, {
        auto_matched_at: new Date().toISOString(),
        auto_match_confidence: result.confidence,
        auto_match_reason: result.reason,
        status: 'payment_verified' // Auto-verify if matched
      })
    } catch (error) {
      console.error('Failed to update payment request with match:', error)
    }
  }

  /**
   * Get matching statistics
   */
  async getMatchingStats(): Promise<{
    total_attempts: number
    successful_matches: number
    average_confidence: number
    rule_performance: Record<string, { attempts: number; successes: number; avg_confidence: number }>
  }> {
    // This would typically query the verification logs
    // For now, return mock data
    return {
      total_attempts: 0,
      successful_matches: 0,
      average_confidence: 0,
      rule_performance: {}
    }
  }

  /**
   * Refresh rules from database
   */
  async refreshRules(): Promise<void> {
    this.isInitialized = false
    await this.initialize()
  }
}

// Export singleton instance
export const autoMatchingService = new AutoMatchingService()


