'use client'

import { Sun, Moon, Type, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ReaderSettings } from '../hooks/use-reader-settings'

interface SettingsPanelProps {
  settings: ReaderSettings
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void
  isVisible: boolean
}

export function SettingsPanel({ settings, onUpdateSettings, isVisible }: SettingsPanelProps) {
  if (!isVisible) return null

  return (
    <Card className="fixed top-12 sm:top-14 right-2 sm:right-4 z-40 w-[calc(100vw-1rem)] sm:w-80 max-h-[calc(100vh-4rem)] overflow-y-auto safe-area-right">
      <CardContent className="p-4">
        <div className="space-mobile-normal">
          <div>
            <h3 className="font-semibold mb-2 text-mobile-lg">Reading Settings</h3>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-sm font-medium mb-2 block">Font Size</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateSettings({ fontSize: 'small' })}
                className={settings.fontSize === 'small' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateSettings({ fontSize: 'medium' })}
                className={settings.fontSize === 'medium' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateSettings({ fontSize: 'large' })}
                className={settings.fontSize === 'large' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-sm font-medium mb-2 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={settings.theme === 'light' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={settings.theme === 'dark' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateSettings({ theme: 'sepia' })}
                className={settings.theme === 'sepia' ? 'bg-primary text-primary-foreground' : ''}
              >
                Sepia
              </Button>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-sm font-medium mb-2 block">Font Family</label>
            <div className="space-y-2">
              {[
                { value: 'serif', label: 'Serif' },
                { value: 'sans-serif', label: 'Sans Serif' },
                { value: 'monospace', label: 'Monospace' }
              ].map((font) => (
                <Button
                  key={font.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateSettings({ fontFamily: font.value as ReaderSettings['fontFamily'] })}
                  className={`w-full justify-start ${
                    settings.fontFamily === font.value ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {font.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}