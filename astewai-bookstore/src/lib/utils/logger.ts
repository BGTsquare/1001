/**
 * Centralized logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  purchaseId?: string
  itemId?: string
  itemType?: string
  transactionReference?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error
    
    const fullContext = { ...context, error: errorDetails }
    console.error(this.formatMessage('error', message, fullContext))
  }

  // Purchase-specific logging methods
  purchaseCreated(purchaseId: string, userId: string, itemType: string, itemId: string): void {
    this.info('Purchase created', {
      purchaseId,
      userId,
      itemType,
      itemId,
      action: 'purchase_created'
    })
  }

  purchaseApproved(purchaseId: string, adminId: string): void {
    this.info('Purchase approved', {
      purchaseId,
      adminId,
      action: 'purchase_approved'
    })
  }

  purchaseRejected(purchaseId: string, adminId: string, reason?: string): void {
    this.info('Purchase rejected', {
      purchaseId,
      adminId,
      reason,
      action: 'purchase_rejected'
    })
  }

  libraryAdditionFailed(purchaseId: string, userId: string, error: string): void {
    this.error('Failed to add purchase to library', new Error(error), {
      purchaseId,
      userId,
      action: 'library_addition_failed'
    })
  }
}

export const logger = new Logger()