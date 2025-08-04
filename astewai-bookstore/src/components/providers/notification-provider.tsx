'use client'

import { NotificationProvider as NotificationContextProvider } from '@/contexts/notification-context'
import type { RealtimeConfig } from '@/lib/types/notifications'

interface NotificationProviderProps {
  children: React.ReactNode
  config?: Partial<RealtimeConfig>
}

export function NotificationProvider({ children, config }: NotificationProviderProps) {
  return (
    <NotificationContextProvider config={config}>
      {children}
    </NotificationContextProvider>
  )
}