'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TelegramSettingsFormProps {
  initialSettings: Record<string, string>
}

export function TelegramSettingsForm({ initialSettings }: TelegramSettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    telegram_payment_instructions: initialSettings.telegram_payment_instructions || '',
    telegram_help_message: initialSettings.telegram_help_message || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/telegram/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      toast.success('Telegram settings updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="payment_instructions" className="block text-sm font-medium text-gray-700 mb-2">
          Payment Instructions
        </label>
        <textarea
          id="payment_instructions"
          rows={4}
          value={settings.telegram_payment_instructions}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            telegram_payment_instructions: e.target.value 
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter the payment instructions shown to users..."
        />
        <p className="text-xs text-gray-500 mt-1">
          This message is shown to users when they start a purchase in Telegram
        </p>
      </div>

      <div>
        <label htmlFor="help_message" className="block text-sm font-medium text-gray-700 mb-2">
          Help Message
        </label>
        <textarea
          id="help_message"
          rows={8}
          value={settings.telegram_help_message}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            telegram_help_message: e.target.value 
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter the help message shown when users type /help..."
        />
        <p className="text-xs text-gray-500 mt-1">
          This message is shown when users type /help in the bot
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
      </button>
    </form>
  )
}