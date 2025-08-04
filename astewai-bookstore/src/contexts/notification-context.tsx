'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './auth-context'
import { getRealtimeService } from '@/lib/services/realtime-service'
import type { 
  NotificationData,
  PurchaseStatusNotification,
  AdminApprovalNotification,
  ReadingProgressNotification,
  ActivityFeedNotification,
  RealtimeConfig
} from '@/lib/types/notifications'
import { toast } from 'sonner'

interface NotificationContextType {
  notifications: NotificationData[]
  unreadCount: number
  isConnected: boolean
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  updateConfig: (config: Partial<RealtimeConfig>) => void
  config: RealtimeConfig
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  config?: Partial<RealtimeConfig>
}

export function NotificationProvider({ children, config }: NotificationProviderProps) {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [realtimeService] = useState(() => getRealtimeService(config))

  // Create notification from different types
  const createNotification = useCallback((
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): NotificationData => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: user?.id || '',
    type: type as any,
    title,
    message,
    data,
    read: false,
    created_at: new Date().toISOString()
  }), [user?.id])

  // Handle purchase status updates
  const handlePurchaseUpdate = useCallback((notification: PurchaseStatusNotification) => {
    const statusMessages = {
      pending: 'Your purchase request is being processed',
      approved: 'Your purchase has been approved!',
      rejected: 'Your purchase request was rejected',
      completed: 'Your purchase is complete!'
    }

    const notificationData = createNotification(
      'purchase_status_update',
      `Purchase ${notification.status}`,
      `${statusMessages[notification.status]} - ${notification.itemTitle}`,
      notification
    )

    setNotifications(prev => [notificationData, ...prev])

    // Show toast notification
    const toastMessage = `${notification.itemTitle}: ${statusMessages[notification.status]}`
    if (notification.status === 'approved' || notification.status === 'completed') {
      toast.success(toastMessage)
    } else if (notification.status === 'rejected') {
      toast.error(toastMessage)
    } else {
      toast.info(toastMessage)
    }
  }, [createNotification])

  // Handle admin approval notifications
  const handleAdminApproval = useCallback((notification: AdminApprovalNotification) => {
    const notificationData = createNotification(
      'admin_approval_required',
      'New Purchase Request',
      `${notification.userDisplayName} requested to purchase ${notification.itemTitle}`,
      notification
    )

    setNotifications(prev => [notificationData, ...prev])

    // Show toast for admins
    if (profile?.role === 'admin') {
      toast.info(`New purchase request from ${notification.userDisplayName}`)
    }
  }, [createNotification, profile?.role])

  // Handle reading progress sync
  const handleProgressSync = useCallback((notification: ReadingProgressNotification) => {
    // Only show notifications for significant progress milestones
    const progress = notification.progress
    const isSignificantMilestone = progress > 0 && (
      progress === 25 || progress === 50 || progress === 75 || progress === 100
    )

    if (isSignificantMilestone || notification.status === 'completed') {
      const message = notification.status === 'completed' 
        ? `You completed "${notification.bookTitle}"!`
        : `You're ${progress}% through "${notification.bookTitle}"`

      const notificationData = createNotification(
        'reading_progress_sync',
        'Reading Progress',
        message,
        notification
      )

      setNotifications(prev => [notificationData, ...prev])

      if (notification.status === 'completed') {
        toast.success(`Congratulations! You completed "${notification.bookTitle}"`)
      }
    }
  }, [createNotification])

  // Handle activity feed updates
  const handleActivityFeed = useCallback((notification: ActivityFeedNotification) => {
    const activityMessages = {
      book_added: `${notification.userDisplayName} added "${notification.itemTitle}" to their library`,
      book_completed: `${notification.userDisplayName} completed "${notification.itemTitle}"`,
      review_posted: `${notification.userDisplayName} reviewed "${notification.itemTitle}"`,
      bundle_purchased: `${notification.userDisplayName} purchased a bundle`
    }

    const notificationData = createNotification(
      'activity_feed',
      'Community Activity',
      activityMessages[notification.activityType],
      notification
    )

    setNotifications(prev => [notificationData, ...prev])
  }, [createNotification])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) {
      setIsConnected(false)
      return
    }

    const subscriptionIds: string[] = []

    try {
      // Subscribe to purchase updates for the current user
      const purchaseSubId = realtimeService.subscribeToPurchaseUpdates(user.id, handlePurchaseUpdate)
      if (purchaseSubId) subscriptionIds.push(purchaseSubId)

      // Subscribe to reading progress sync for the current user
      const progressSubId = realtimeService.subscribeToProgressSync(user.id, handleProgressSync)
      if (progressSubId) subscriptionIds.push(progressSubId)

      // Subscribe to admin notifications if user is admin
      if (profile?.role === 'admin') {
        const adminSubId = realtimeService.subscribeToAdminNotifications(handleAdminApproval)
        if (adminSubId) subscriptionIds.push(adminSubId)
      }

      // Subscribe to activity feed
      const activitySubId = realtimeService.subscribeToActivityFeed(handleActivityFeed)
      if (activitySubId) subscriptionIds.push(activitySubId)

      setIsConnected(true)
    } catch (error) {
      console.error('Failed to set up real-time subscriptions:', error)
      setIsConnected(false)
    }

    // Cleanup subscriptions on unmount or user change
    return () => {
      subscriptionIds.forEach(id => realtimeService.unsubscribe(id))
      setIsConnected(false)
    }
  }, [user, profile?.role, realtimeService, handlePurchaseUpdate, handleProgressSync, handleAdminApproval, handleActivityFeed])

  // Notification management functions
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const updateConfig = useCallback((newConfig: Partial<RealtimeConfig>) => {
    realtimeService.updateConfig(newConfig)
  }, [realtimeService])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  const value = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    updateConfig,
    config: realtimeService.getConfig()
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}