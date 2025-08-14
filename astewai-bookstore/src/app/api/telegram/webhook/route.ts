import { NextRequest, NextResponse } from 'next/server'
import { TelegramService } from '@/lib/services/telegram-service'
import { purchaseService } from '@/lib/services/purchase-service'
import { TelegramWebhookHandler } from '@/lib/services/telegram-webhook-handler'
import { TelegramConfigValidator } from '@/lib/config/telegram-config'

// Import types instead of duplicating them
import type { TelegramUpdate } from '@/lib/types/telegram'

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    const configValidation = TelegramConfigValidator.validate()
    if (!configValidation.isValid) {
      console.error('Telegram configuration errors:', configValidation.errors)
      return NextResponse.json({ 
        error: 'Service temporarily unavailable',
        details: configValidation.errors 
      }, { status: 503 })
    }

    const config = configValidation.config!

    const update: TelegramUpdate = await request.json()
    console.log('📨 Received Telegram update:', JSON.stringify(update, null, 2))

    // Initialize services
    const telegramService = new TelegramService(config.botToken)
    const webhookHandler = new TelegramWebhookHandler(telegramService, purchaseService)

    // Process the update
    await webhookHandler.handleUpdate(update)

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('❌ Error in Telegram webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



