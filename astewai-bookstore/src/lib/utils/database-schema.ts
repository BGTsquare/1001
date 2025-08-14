import { createClient } from '@/lib/supabase/server'

export interface SchemaValidationResult {
  hasTelegramColumns: boolean
  missingColumns: string[]
}

export class DatabaseSchemaValidator {
  private static instance: DatabaseSchemaValidator
  private schemaCache: Map<string, SchemaValidationResult> = new Map()

  static getInstance(): DatabaseSchemaValidator {
    if (!DatabaseSchemaValidator.instance) {
      DatabaseSchemaValidator.instance = new DatabaseSchemaValidator()
    }
    return DatabaseSchemaValidator.instance
  }

  async validatePurchasesTableSchema(): Promise<SchemaValidationResult> {
    const cacheKey = 'purchases_schema'
    
    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey)!
    }

    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from('purchases')
        .select('amount_in_birr, initiation_token, telegram_chat_id, telegram_user_id')
        .limit(1)

      const result: SchemaValidationResult = {
        hasTelegramColumns: !error,
        missingColumns: error ? ['amount_in_birr', 'initiation_token', 'telegram_chat_id', 'telegram_user_id'] : []
      }

      // Cache for 5 minutes
      this.schemaCache.set(cacheKey, result)
      setTimeout(() => this.schemaCache.delete(cacheKey), 5 * 60 * 1000)

      return result
    } catch (error) {
      console.error('Schema validation error:', error)
      return {
        hasTelegramColumns: false,
        missingColumns: ['amount_in_birr', 'initiation_token', 'telegram_chat_id', 'telegram_user_id']
      }
    }
  }
}

export const schemaValidator = DatabaseSchemaValidator.getInstance()