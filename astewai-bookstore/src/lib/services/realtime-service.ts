import { createClient } from '@/lib/supabase/client'
import type { 
  NotificationData, 
  RealtimeSubscription, 
  RealtimeConfig,
  PurchaseStatusNotification,
  AdminApprovalNotification,
  ReadingProgressNotification,
  ActivityFeedNotification
} from '@/lib/types/notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

export class RealtimeService {
  private supabase = createClient()
  private subscriptions = new Map<string, RealtimeSubscription>()
  private channels = new Map<string, RealtimeChannel>()
  private config: RealtimeConfig = {
    enablePurchaseUpdates: true,
    enableAdminNotifications: true,
    enableProgressSync: true,
    enableActivityFeed: true,
    enablePushNotifications: true
  }

  constructor(config?: Partial<RealtimeConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Subscribe to real-time purchase status updates for a user
   */
  subscribeToPurchaseUpdates(userId: string, callback: (notification: PurchaseStatusNotification) => void): string {
    if (!this.config.enablePurchaseUpdates) return ''

    const subscriptionId = `purchase_updates_${userId}`
    const channelName = `purchase_updates:user_id=eq.${userId}`

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const purchase = payload.new as any
          const notification: PurchaseStatusNotification = {
            type: 'purchase_status_update',
            purchaseId: purchase.id,
            status: purchase.status,
            itemType: purchase.item_type,
            itemId: purchase.item_id,
            itemTitle: 'Item' // Will be enriched with actual title
          }
          callback(notification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'purchase_requests',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const request = payload.new as any
          const notification: PurchaseStatusNotification = {
            type: 'purchase_status_update',
            purchaseId: request.id,
            status: request.status,
            itemType: request.item_type,
            itemId: request.item_id,
            itemTitle: 'Item' // Will be enriched with actual title
          }
          callback(notification)
        }
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: channelName,
      event: 'purchase_updates',
      callback,
      cleanup: () => {
        channel.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(subscriptionId)
      }
    }

    this.channels.set(channelName, channel)
    this.subscriptions.set(subscriptionId, subscription)
    return subscriptionId
  }

  /**
   * Subscribe to admin approval notifications
   */
  subscribeToAdminNotifications(callback: (notification: AdminApprovalNotification) => void): string {
    if (!this.config.enableAdminNotifications) return ''

    const subscriptionId = 'admin_notifications'
    const channelName = 'admin_notifications'

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_requests'
        },
        async (payload) => {
          const request = payload.new as any
          
          // Fetch additional data for the notification
          const { data: profile } = await this.supabase
            .from('profiles')
            .select('display_name')
            .eq('id', request.user_id)
            .single()

          let itemTitle = 'Unknown Item'
          if (request.item_type === 'book') {
            const { data: book } = await this.supabase
              .from('books')
              .select('title')
              .eq('id', request.item_id)
              .single()
            itemTitle = book?.title || itemTitle
          } else if (request.item_type === 'bundle') {
            const { data: bundle } = await this.supabase
              .from('bundles')
              .select('title')
              .eq('id', request.item_id)
              .single()
            itemTitle = bundle?.title || itemTitle
          }

          const notification: AdminApprovalNotification = {
            type: 'admin_approval_required',
            requestId: request.id,
            requestType: 'purchase_request',
            userId: request.user_id,
            userDisplayName: profile?.display_name || 'Unknown User',
            itemType: request.item_type,
            itemId: request.item_id,
            itemTitle,
            amount: request.amount
          }
          callback(notification)
        }
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: channelName,
      event: 'admin_notifications',
      callback,
      cleanup: () => {
        channel.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(subscriptionId)
      }
    }

    this.channels.set(channelName, channel)
    this.subscriptions.set(subscriptionId, subscription)
    return subscriptionId
  }

  /**
   * Subscribe to reading progress synchronization
   */
  subscribeToProgressSync(userId: string, callback: (notification: ReadingProgressNotification) => void): string {
    if (!this.config.enableProgressSync) return ''

    const subscriptionId = `progress_sync_${userId}`
    const channelName = `progress_sync:user_id=eq.${userId}`

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_library',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const libraryItem = payload.new as any
          
          // Fetch book title
          const { data: book } = await this.supabase
            .from('books')
            .select('title')
            .eq('id', libraryItem.book_id)
            .single()

          const notification: ReadingProgressNotification = {
            type: 'reading_progress_sync',
            bookId: libraryItem.book_id,
            bookTitle: book?.title || 'Unknown Book',
            progress: libraryItem.progress,
            lastReadPosition: libraryItem.last_read_position,
            status: libraryItem.status
          }
          callback(notification)
        }
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: channelName,
      event: 'progress_sync',
      callback,
      cleanup: () => {
        channel.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(subscriptionId)
      }
    }

    this.channels.set(channelName, channel)
    this.subscriptions.set(subscriptionId, subscription)
    return subscriptionId
  }

  /**
   * Subscribe to activity feed updates
   */
  subscribeToActivityFeed(callback: (notification: ActivityFeedNotification) => void): string {
    if (!this.config.enableActivityFeed) return ''

    const subscriptionId = 'activity_feed'
    const channelName = 'activity_feed'

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_library'
        },
        async (payload) => {
          const libraryItem = payload.new as any
          
          // Fetch user and book data
          const [{ data: profile }, { data: book }] = await Promise.all([
            this.supabase
              .from('profiles')
              .select('display_name')
              .eq('id', libraryItem.user_id)
              .single(),
            this.supabase
              .from('books')
              .select('title')
              .eq('id', libraryItem.book_id)
              .single()
          ])

          const notification: ActivityFeedNotification = {
            type: 'activity_feed',
            activityType: 'book_added',
            userId: libraryItem.user_id,
            userDisplayName: profile?.display_name || 'Unknown User',
            itemId: libraryItem.book_id,
            itemTitle: book?.title || 'Unknown Book',
            metadata: {
              status: libraryItem.status,
              addedAt: libraryItem.added_at
            }
          }
          callback(notification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_library',
          filter: 'status=eq.completed'
        },
        async (payload) => {
          const libraryItem = payload.new as any
          const oldLibraryItem = payload.old as any
          
          // Only trigger if status changed to completed
          if (oldLibraryItem.status !== 'completed' && libraryItem.status === 'completed') {
            const [{ data: profile }, { data: book }] = await Promise.all([
              this.supabase
                .from('profiles')
                .select('display_name')
                .eq('id', libraryItem.user_id)
                .single(),
              this.supabase
                .from('books')
                .select('title')
                .eq('id', libraryItem.book_id)
                .single()
            ])

            const notification: ActivityFeedNotification = {
              type: 'activity_feed',
              activityType: 'book_completed',
              userId: libraryItem.user_id,
              userDisplayName: profile?.display_name || 'Unknown User',
              itemId: libraryItem.book_id,
              itemTitle: book?.title || 'Unknown Book',
              metadata: {
                progress: libraryItem.progress,
                completedAt: new Date().toISOString()
              }
            }
            callback(notification)
          }
        }
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: channelName,
      event: 'activity_feed',
      callback,
      cleanup: () => {
        channel.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(subscriptionId)
      }
    }

    this.channels.set(channelName, channel)
    this.subscriptions.set(subscriptionId, subscription)
    return subscriptionId
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.cleanup()
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.cleanup()
    }
    this.subscriptions.clear()
    this.channels.clear()
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): RealtimeConfig {
    return { ...this.config }
  }
}

// Singleton instance
let realtimeServiceInstance: RealtimeService | null = null

export function getRealtimeService(config?: Partial<RealtimeConfig>): RealtimeService {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new RealtimeService(config)
  }
  return realtimeServiceInstance
}