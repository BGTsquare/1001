import { createClient } from '@/lib/supabase/client'
import type { 
  PushNotificationPayload, 
  PushSubscription as CustomPushSubscription,
  NotificationData 
} from '@/lib/types/notifications'

export class PushNotificationService {
  private supabase = createClient()
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  constructor() {
    this.initializeServiceWorker()
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<CustomPushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not registered')
      return null
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('Push notification permission not granted')
      return null
    }

    try {
      // Get VAPID public key from environment or API
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return null
      }

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })

      // Save subscription to database
      const subscriptionData: Omit<CustomPushSubscription, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        endpoint: this.subscription.endpoint,
        p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!),
        user_agent: navigator.userAgent
      }

      const { data, error } = await this.supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'user_id,endpoint',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to save push subscription:', error)
        return null
      }

      console.log('Push notification subscription successful')
      return data
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        this.subscription = null
      }

      // Remove subscription from database
      const { error } = await this.supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to remove push subscription from database:', error)
        return false
      }

      console.log('Push notification unsubscription successful')
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  /**
   * Send a local notification (for testing or immediate feedback)
   */
  async sendLocalNotification(payload: PushNotificationPayload): Promise<void> {
    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('Cannot send local notification: permission not granted')
      return
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions?.map(action => ({
          action: action.action,
          title: action.title,
          icon: action.icon
        }))
      })

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        
        // Handle custom data or navigation
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank')
        }
        
        notification.close()
      }

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)
    } catch (error) {
      console.error('Failed to send local notification:', error)
    }
  }

  /**
   * Check if push notifications are supported and enabled
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  }

  /**
   * Convert notification data to push payload
   */
  notificationToPushPayload(notification: NotificationData): PushNotificationPayload {
    const basePayload: PushNotificationPayload = {
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: notification.type,
      data: {
        notificationId: notification.id,
        type: notification.type,
        ...notification.data
      }
    }

    // Customize based on notification type
    switch (notification.type) {
      case 'purchase_status_update':
        return {
          ...basePayload,
          actions: [
            { action: 'view', title: 'View Purchase', icon: '/icons/view.png' },
            { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
          ]
        }
      
      case 'admin_approval_required':
        return {
          ...basePayload,
          actions: [
            { action: 'approve', title: 'Approve', icon: '/icons/approve.png' },
            { action: 'review', title: 'Review', icon: '/icons/review.png' }
          ]
        }
      
      case 'reading_progress_sync':
        return {
          ...basePayload,
          actions: [
            { action: 'continue', title: 'Continue Reading', icon: '/icons/book.png' },
            { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
          ]
        }
      
      default:
        return basePayload
    }
  }

  /**
   * Utility: Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Utility: Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

// Singleton instance
let pushNotificationServiceInstance: PushNotificationService | null = null

export function getPushNotificationService(): PushNotificationService {
  if (!pushNotificationServiceInstance) {
    pushNotificationServiceInstance = new PushNotificationService()
  }
  return pushNotificationServiceInstance
}