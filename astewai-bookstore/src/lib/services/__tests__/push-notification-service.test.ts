import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PushNotificationService } from '../push-notification-service'
import type { PushNotificationPayload, NotificationData } from '@/lib/types/notifications'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null })
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Mock browser APIs
const mockServiceWorkerRegistration = {
  pushManager: {
    subscribe: vi.fn(),
    getSubscription: vi.fn()
  }
}

const mockPushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test',
  getKey: vi.fn((name: string) => {
    if (name === 'p256dh') return new ArrayBuffer(65)
    if (name === 'auth') return new ArrayBuffer(16)
    return null
  }),
  unsubscribe: vi.fn().mockResolvedValue(true)
}

const mockNotification = {
  close: vi.fn(),
  onclick: null
}

// Setup global mocks
const mockNavigator = {
  serviceWorker: {
    register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration)
  },
  userAgent: 'Test User Agent'
}

const mockNotificationClass = vi.fn().mockImplementation((title, options) => {
  return { ...mockNotification, title, ...options }
})

mockNotificationClass.permission = 'default'
mockNotificationClass.requestPermission = vi.fn().mockResolvedValue('granted')

const mockWindow = {
  Notification: mockNotificationClass,
  PushManager: vi.fn(),
  atob: vi.fn((str) => str),
  btoa: vi.fn((str) => str)
}

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

// Also set Notification globally
Object.defineProperty(global, 'Notification', {
  value: mockNotificationClass,
  writable: true
})

describe('PushNotificationService', () => {
  let pushService: PushNotificationService

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mocks
    mockNavigator.serviceWorker.register.mockResolvedValue(mockServiceWorkerRegistration)
    mockNotificationClass.permission = 'default'
    mockNotificationClass.requestPermission.mockResolvedValue('granted')
    
    pushService = new PushNotificationService()
  })

  describe('initialization', () => {
    it('should initialize service worker', async () => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
    })

    it('should handle service worker registration failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error('Registration failed'))
      
      new PushNotificationService()
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(consoleSpy).toHaveBeenCalledWith('Service Worker registration failed:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('permission management', () => {
    it('should request notification permission', async () => {
      const permission = await pushService.requestPermission()
      
      expect(mockNotificationClass.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should return existing permission if already granted', async () => {
      mockNotificationClass.permission = 'granted'
      
      const permission = await pushService.requestPermission()
      
      expect(mockNotificationClass.requestPermission).not.toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should return denied if permission is denied', async () => {
      mockNotificationClass.permission = 'denied'
      
      const permission = await pushService.requestPermission()
      
      expect(permission).toBe('denied')
    })

    it('should get current permission status', () => {
      mockNotificationClass.permission = 'granted'
      
      expect(pushService.getPermissionStatus()).toBe('granted')
    })
  })

  describe('subscription management', () => {
    beforeEach(() => {
      mockNotificationClass.permission = 'granted'
      mockServiceWorkerRegistration.pushManager.subscribe.mockResolvedValue(mockPushSubscription)
      
      // Mock the full Supabase chain for upsert
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'sub-123' }, error: null })
          })
        })
      })
      
      // Mock environment variable
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key'
    })

    it('should subscribe to push notifications', async () => {
      const userId = 'user-123'
      const subscription = await pushService.subscribe(userId)
      
      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array)
      })
      
      expect(subscription).toEqual({ id: 'sub-123' })
    })

    it('should handle subscription failure', async () => {
      mockServiceWorkerRegistration.pushManager.subscribe.mockRejectedValue(new Error('Subscription failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const subscription = await pushService.subscribe('user-123')
      
      expect(subscription).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to subscribe to push notifications:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should unsubscribe from push notifications', async () => {
      const userId = 'user-123'
      
      // Set up subscription first
      pushService['subscription'] = mockPushSubscription
      
      // Mock the full Supabase chain for delete
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
      
      const result = await pushService.unsubscribe(userId)
      
      expect(mockPushSubscription.unsubscribe).toHaveBeenCalled()
      expect(result).toBe(true)
    })
  })

  describe('local notifications', () => {
    beforeEach(() => {
      mockNotificationClass.permission = 'granted'
    })

    it('should send local notification', async () => {
      const payload: PushNotificationPayload = {
        title: 'Test Notification',
        body: 'This is a test notification',
        icon: '/test-icon.png'
      }
      
      await pushService.sendLocalNotification(payload)
      
      expect(mockNotificationClass).toHaveBeenCalledWith('Test Notification', {
        body: 'This is a test notification',
        icon: '/test-icon.png',
        badge: '/badge-72x72.png',
        tag: undefined,
        data: undefined,
        actions: undefined
      })
    })

    it('should not send notification without permission', async () => {
      mockNotificationClass.permission = 'denied'
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const payload: PushNotificationPayload = {
        title: 'Test Notification',
        body: 'This is a test notification'
      }
      
      await pushService.sendLocalNotification(payload)
      
      expect(mockNotificationClass).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Cannot send local notification: permission not granted')
      consoleSpy.mockRestore()
    })
  })

  describe('notification conversion', () => {
    it('should convert notification data to push payload', () => {
      const notificationData: NotificationData = {
        id: 'notif-123',
        user_id: 'user-123',
        type: 'purchase_status_update',
        title: 'Purchase Approved',
        message: 'Your book purchase has been approved',
        data: { purchaseId: 'purchase-123' },
        read: false,
        created_at: new Date().toISOString()
      }
      
      const payload = pushService.notificationToPushPayload(notificationData)
      
      expect(payload).toEqual({
        title: 'Purchase Approved',
        body: 'Your book purchase has been approved',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'purchase_status_update',
        data: {
          notificationId: 'notif-123',
          type: 'purchase_status_update',
          purchaseId: 'purchase-123'
        },
        actions: [
          { action: 'view', title: 'View Purchase', icon: '/icons/view.png' },
          { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
        ]
      })
    })

    it('should handle different notification types', () => {
      const adminNotification: NotificationData = {
        id: 'notif-456',
        user_id: 'admin-123',
        type: 'admin_approval_required',
        title: 'Approval Required',
        message: 'New purchase request needs approval',
        data: {},
        read: false,
        created_at: new Date().toISOString()
      }
      
      const payload = pushService.notificationToPushPayload(adminNotification)
      
      expect(payload.actions).toEqual([
        { action: 'approve', title: 'Approve', icon: '/icons/approve.png' },
        { action: 'review', title: 'Review', icon: '/icons/review.png' }
      ])
    })
  })

  describe('browser support', () => {
    it('should detect push notification support', () => {
      expect(pushService.isSupported()).toBe(true)
    })

    it('should detect lack of support', () => {
      // Remove service worker support
      const originalNavigator = global.navigator
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      })
      
      const service = new PushNotificationService()
      expect(service.isSupported()).toBe(false)
      
      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true
      })
    })
  })
})