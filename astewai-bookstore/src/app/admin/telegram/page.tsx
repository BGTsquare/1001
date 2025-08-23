import { createClient } from '@/lib/supabase/server'
import { TelegramSettingsForm } from '@/components/admin/telegram-settings-form'
import { TelegramPurchasesList } from '@/components/admin/telegram-purchases-list'

export default async function TelegramAdminPage() {
  const supabase = await createClient()

  // Get current Telegram settings
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('key, value')
    .in('key', ['telegram_payment_instructions', 'telegram_help_message'])

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}

  // Get recent Telegram purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      id,
      transaction_reference,
      item_type,
      item_id,
      amount,
      status,
      telegram_chat_id,
      telegram_user_id,
      created_at
    `)
    .not('telegram_chat_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Telegram Bot Management</h1>
        <p className="text-gray-600 mt-2">
          Manage Telegram bot settings and monitor purchase flow
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bot Settings</h2>
          <TelegramSettingsForm initialSettings={settingsMap} />
        </div>

        {/* Bot Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bot Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bot Token</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                process.env.TELEGRAM_BOT_TOKEN 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bot Username</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                process.env.TELEGRAM_BOT_USERNAME 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {process.env.TELEGRAM_BOT_USERNAME ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Admin Channel</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                process.env.TELEGRAM_ADMIN_CHANNEL_ID 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {process.env.TELEGRAM_ADMIN_CHANNEL_ID ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Environment Variables</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>TELEGRAM_BOT_TOKEN: {process.env.TELEGRAM_BOT_TOKEN ? '✓ Set' : '✗ Missing'}</div>
                <div>TELEGRAM_BOT_USERNAME: {process.env.TELEGRAM_BOT_USERNAME ? '✓ Set' : '✗ Missing'}</div>
                <div>TELEGRAM_ADMIN_CHANNEL_ID: {process.env.TELEGRAM_ADMIN_CHANNEL_ID ? '✓ Set' : '✗ Missing'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Telegram Purchases</h2>
          <p className="text-gray-600 text-sm mt-1">
            Purchases initiated through the Telegram bot
          </p>
        </div>
        <TelegramPurchasesList purchases={(purchases || []).map((purchase: any) => ({
          ...purchase,
          transaction_reference: purchase.transaction_reference || 'N/A',
          item_title: `${purchase.item_type}: ${purchase.item_id}`,
          amount_in_birr: purchase.amount || 0,
          purchase_screenshots: [],
          telegram_chat_id: purchase.telegram_chat_id || 0,
          telegram_user_id: purchase.telegram_user_id || 0
        } as any))} />
      </div>
    </div>
  )
}