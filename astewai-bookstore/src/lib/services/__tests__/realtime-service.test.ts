import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RealtimeService } from '../realtime-service'
import type { 
  PurchaseStatusNotification,
  AdminApprovalNotification,
  ReadingProgressNotification,
  ActivityFeedNotification
} from '@/lib/types/notifications'

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn()
}

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null })
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('RealtimeService', () => {
  let realtimeService: RealtimeService
  let mockCallback: vi.Mock

  beforeEach(() => {
    realtimeService = new RealtimeService()
    mockCallback = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    realtimeService.unsubscribeAll()
  })

  describe('subscribeToPurchaseUpdates', () => {
    it('should create subscription for purchase updates', () => {
      const userId = 'user-123'
      
      const subscriptionId = realtimeService.subscribeToPurchaseUpdates(userId, mockCallback)
      
      expect(subscriptionId).toBe(`purchase_updates_${userId}`)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`purchase_updates:user_id=eq.${userId}`)
      expect(mockChannel.on).toHaveBeenCalledTimes(2) // purchases and purchase_requests
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    it('should handle purchase status update callback', async () => {
      const userId = 'user-123'
      realtimeService.subscribeToPurchaseUpdates(userId, mockCallback)
      
      // Simulate purchase update
      const purchaseUpdate = {
        id: 'purchase-123',
        status: 'approved',
        item_type: 'book',
        item_id: 'book-123'
      }
      
      // Get the callback that was registered with the channel
      const onCallback = mockChannel.on.mock.calls[0][2]
      await onCallback({ new: purchaseUpdate })
      
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'purchase_status_update',
        purchaseId: 'purchase-123',
        status: 'approved',
        itemType: 'book',
        itemId: 'book-123',
        itemTitle: 'Item'
      })
    })

    it('should return empty string when purchase updates disabled', () => {
      const service = new RealtimeService({ enablePurchaseUpdates: false })
      const subscriptionId = service.subscribeToPurchaseUpdates('user-123', mockCallback)
      
      expect(subscriptionId).toBe('')
      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })
  })

  describe('subscribeToAdminNotifications', () => {
    it('should create subscription for admin notifications', () => {
      const subscriptionId = realtimeService.subscribeToAdminNotifications(mockCallback)
      
      expect(subscriptionId).toBe('admin_notifications')
      expect(mockSupabase.channel).toHaveBeenCalledWith('admin_notifications')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_requests'
        },
        expect.any(Function)
      )
    })

    it('should handle admin approval notification callback', async () => {
      // Mock database responses
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { display_name: 'John Doe' }
            })
          }
        } else if (table === 'books') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { title: 'Test Book' }
            })
          }
        }
        return mockSupabase
      })

      realtimeService.subscribeToAdminNotifications(mockCallback)
      
      const purchaseRequest = {
        id: 'request-123',
        user_id: 'user-123',
        item_type: 'book',
        item_id: 'book-123',
        amount: 29.99
      }
      
      const onCallback = mockChannel.on.mock.calls[0][2]
      await onCallback({ new: purchaseRequest })
      
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'admin_approval_required',
        requestId: 'request-123',
        requestType: 'purchase_request',
        userId: 'user-123',
        userDisplayName: 'John Doe',
        itemType: 'book',
        itemId: 'book-123',
        itemTitle: 'Test Book',
        amount: 29.99
      })
    })
  })

  describe('subscribeToProgressSync', () => {
    it('should create subscription for progress sync', () => {
      const userId = 'user-123'
      
      const subscriptionId = realtimeService.subscribeToProgressSync(userId, mockCallback)
      
      expect(subscriptionId).toBe(`progress_sync_${userId}`)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`progress_sync:user_id=eq.${userId}`)
    })

    it('should handle progress sync callback', async () => {
      // Mock book data
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { title: 'Test Book' }
        })
      })

      const userId = 'user-123'
      realtimeService.subscribeToProgressSync(userId, mockCallback)
      
      const libraryUpdate = {
        book_id: 'book-123',
        progress: 75,
        last_read_position: 'chapter-5',
        status: 'owned'
      }
      
      const onCallback = mockChannel.on.mock.calls[0][2]
      await onCallback({ new: libraryUpdate })
      
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'reading_progress_sync',
        bookId: 'book-123',
        bookTitle: 'Test Book',
        progress: 75,
        lastReadPosition: 'chapter-5',
        status: 'owned'
      })
    })
  })

  describe('subscribeToActivityFeed', () => {
    it('should create subscription for activity feed', () => {
      const subscriptionId = realtimeService.subscribeToActivityFeed(mockCallback)
      
      expect(subscriptionId).toBe('activity_feed')
      expect(mockSupabase.channel).toHaveBeenCalledWith('activity_feed')
      expect(mockChannel.on).toHaveBeenCalledTimes(2) // INSERT and UPDATE events
    })

    it('should handle book added activity', async () => {
      // Mock database responses
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { display_name: 'Jane Doe' }
            })
          }
        } else if (table === 'books') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { title: 'New Book' }
            })
          }
        }
        return mockSupabase
      })

      realtimeService.subscribeToActivityFeed(mockCallback)
      
      const libraryInsert = {
        user_id: 'user-123',
        book_id: 'book-123',
        status: 'owned',
        added_at: new Date().toISOString()
      }
      
      const onCallback = mockChannel.on.mock.calls[0][2]
      await onCallback({ new: libraryInsert })
      
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'activity_feed',
        activityType: 'book_added',
        userId: 'user-123',
        userDisplayName: 'Jane Doe',
        itemId: 'book-123',
        itemTitle: 'New Book',
        metadata: {
          status: 'owned',
          addedAt: libraryInsert.added_at
        }
      })
    })
  })

  describe('subscription management', () => {
    it('should track active subscriptions', () => {
      expect(realtimeService.getActiveSubscriptionCount()).toBe(0)
      
      realtimeService.subscribeToPurchaseUpdates('user-123', mockCallback)
      expect(realtimeService.getActiveSubscriptionCount()).toBe(1)
      
      realtimeService.subscribeToAdminNotifications(mockCallback)
      expect(realtimeService.getActiveSubscriptionCount()).toBe(2)
    })

    it('should unsubscribe specific subscription', () => {
      const subscriptionId = realtimeService.subscribeToPurchaseUpdates('user-123', mockCallback)
      expect(realtimeService.getActiveSubscriptionCount()).toBe(1)
      
      realtimeService.unsubscribe(subscriptionId)
      expect(realtimeService.getActiveSubscriptionCount()).toBe(0)
      expect(mockChannel.unsubscribe).toHaveBeenCalled()
    })

    it('should unsubscribe all subscriptions', () => {
      realtimeService.subscribeToPurchaseUpdates('user-123', mockCallback)
      realtimeService.subscribeToAdminNotifications(mockCallback)
      expect(realtimeService.getActiveSubscriptionCount()).toBe(2)
      
      realtimeService.unsubscribeAll()
      expect(realtimeService.getActiveSubscriptionCount()).toBe(0)
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2)
    })
  })

  describe('configuration', () => {
    it('should use default configuration', () => {
      const config = realtimeService.getConfig()
      
      expect(config).toEqual({
        enablePurchaseUpdates: true,
        enableAdminNotifications: true,
        enableProgressSync: true,
        enableActivityFeed: true,
        enablePushNotifications: true
      })
    })

    it('should update configuration', () => {
      realtimeService.updateConfig({
        enablePurchaseUpdates: false,
        enableProgressSync: false
      })
      
      const config = realtimeService.getConfig()
      expect(config.enablePurchaseUpdates).toBe(false)
      expect(config.enableProgressSync).toBe(false)
      expect(config.enableAdminNotifications).toBe(true) // unchanged
    })

    it('should respect disabled features', () => {
      const service = new RealtimeService({
        enablePurchaseUpdates: false,
        enableAdminNotifications: false
      })
      
      const purchaseSubId = service.subscribeToPurchaseUpdates('user-123', mockCallback)
      const adminSubId = service.subscribeToAdminNotifications(mockCallback)
      
      expect(purchaseSubId).toBe('')
      expect(adminSubId).toBe('')
      expect(service.getActiveSubscriptionCount()).toBe(0)
    })
  })
})