import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { ReadingPreferences } from '@/types'

export interface ReaderSettings extends ReadingPreferences {
  fontSize: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark' | 'sepia'
  fontFamily: 'serif' | 'sans-serif' | 'monospace'
}

interface UseReaderSettingsReturn {
  settings: ReaderSettings
  updateSettings: (newSettings: Partial<ReaderSettings>) => Promise<void>
  getThemeClasses: () => string
  getFontSizeClasses: () => string
  getFontFamilyClasses: () => string
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 'medium',
  theme: 'light',
  fontFamily: 'serif'
}

export function useReaderSettings(): UseReaderSettingsReturn {
  const { user } = useAuth()
  
  const [settings, setSettings] = useState<ReaderSettings>({
    ...DEFAULT_SETTINGS,
    ...(user?.reading_preferences as ReadingPreferences || {})
  })

  // Update reader settings
  const updateSettings = useCallback(async (newSettings: Partial<ReaderSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    // Save to user preferences
    try {
      await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reading_preferences: updatedSettings
        }),
      })
    } catch (error) {
      console.error('Error saving reading preferences:', error)
    }
  }, [settings])

  // Get theme classes
  const getThemeClasses = useCallback(() => {
    const base = 'transition-colors duration-200'
    switch (settings.theme) {
      case 'dark':
        return `${base} bg-gray-900 text-gray-100`
      case 'sepia':
        return `${base} bg-amber-50 text-amber-900`
      default:
        return `${base} bg-white text-gray-900`
    }
  }, [settings.theme])

  // Get font size classes
  const getFontSizeClasses = useCallback(() => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-sm leading-relaxed'
      case 'large':
        return 'text-lg leading-relaxed'
      default:
        return 'text-base leading-relaxed'
    }
  }, [settings.fontSize])

  // Get font family classes
  const getFontFamilyClasses = useCallback(() => {
    switch (settings.fontFamily) {
      case 'sans-serif':
        return 'font-sans'
      case 'monospace':
        return 'font-mono'
      default:
        return 'font-serif'
    }
  }, [settings.fontFamily])

  return {
    settings,
    updateSettings,
    getThemeClasses,
    getFontSizeClasses,
    getFontFamilyClasses
  }
}