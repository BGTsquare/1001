import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { telegram_payment_instructions, telegram_help_message } = body

    // Update or insert settings
    const settings = [
      {
        key: 'telegram_payment_instructions',
        value: telegram_payment_instructions,
        description: 'Payment instructions shown to users in Telegram bot'
      },
      {
        key: 'telegram_help_message',
        value: telegram_help_message,
        description: 'Help message shown in Telegram bot'
      }
    ]

    for (const setting of settings) {
      await supabase
        .from('admin_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating Telegram settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}