import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { NotificationProvider, useNotifications } from '../notification-context'
import { AuthProvider } from '../auth-context'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

// Mock the auth context
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {}
}

const mockProfile: Profile = {
  id: 'user-123',
  display_name: 'Test User',
  avatar_url: null,
  role: 'user',
  reading_preferences: {},
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

const mockAuthContext = {
  user: mockUser,
  profile: mockProfile,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn()
}

vi.mock('../auth-context', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock the realtime service
const mockRealtimeService = {
  subscribeToPurchaseUpdates: vi.fn().mockReturnValue('purchase-sub-123'),
  subscribeToProgressSync: vi.fn().mockReturnValue('progress-sub-123'),
  subscribeToAdminNotifications: vi.fn().mockReturnValue('admin-sub-123'),
  subscribeToActivityFeed: vi.fn().mockReturnValue('activity-sub-123'),
  unsubscribe: vi.fn(),
  updateConfig: vi.fn(),
  getConfig: vi.fn().mockReturnValue({
    enablePurchaseUpdates: true,
    enableAdminNotifications: true,
    enableProgressSync: true,
    enableActivityFeed: true,
    enablePushNotifications: true
  })
}

vi.mock('@/lib/services/realtime-service', () => ({
  getRealtimeService: () => mockRealtimeService
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Test component to access the context
function TestComponent() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    updateConfig,
    config
  } = useNotifications()

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="is-connected">{isConnected.toString()}</div>
      <button onClick={() => markAsRead('test-id')}>Mark as Read</button>
      <button onClick={markAllAsRead}>Mark All as Read</button>
      <button onClick={() => clearNotification('test-id')}>Clear Notification</button>
      <button onClick={clearAllNotifications}>Clear All</button>
      <button onClick={() => updateConfig({ enablePurchaseUpdates: false })}>Update Config</button>
      <div data-testid="config">{JSON.stringify(config)}</div>
    </div>
  )
}

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should provide notification context', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    expect(screen.getByTestId('is-connected')).toHaveTextContent('true')
  })

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useNotifications must be used within a NotificationProvider')
    
    consoleSpy.mockRestore()
  })

  it('should set up subscriptions when user is authenticated', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await waitFor(() => {
      expect(mockRealtimeService.subscribeToPurchaseUpdates).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function)
      )
      expect(mockRealtimeService.subscribeToProgressSync).toHaveBeenCalledWith(
        'user-123',
        expect.any(Function)
      )
      expect(mockRealtimeService.subscribeToActivityFeed).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })

    // Should not subscribe to admin notifications for regular user
    expect(mockRealtimeService.subscribeToAdminNotifications).not.toHaveBeenCalled()
  })

  it('should set up admin subscriptions for admin users', async () => {
    mockAuthContext.profile = { ...mockProfile, role: 'admin' }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    await waitFor(() => {
      expect(mockRealtimeService.subscribeToAdminNotifications).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })
  })

  it('should not set up subscriptions when user is not authenticated', () => {
    mockAuthContext.user = null
    mockAuthContext.profile = null

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    expect(screen.getByTestId('is-connected')).toHaveTextContent('false')
    expect(mockRealtimeService.subscribeToPurchaseUpdates).not.toHaveBeenCalled()
  })

  it('should handle purchase status notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    // Get the callback that was registered
    const purchaseCallback = mockRealtimeService.subscribeToPurchaseUpdates.mock.calls[0][1]
    
    // Simulate a purchase status update
    purchaseCallback({
      type: 'purchase_status_update',
      purchaseId: 'purchase-123',
      status: 'approved',
      itemType: 'book',
      itemId: 'book-123',
      itemTitle: 'Test Book'
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')
    })
  })

  it('should handle reading progress notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const progressCallback = mockRealtimeService.subscribeToProgressSync.mock.calls[0][1]
    
    // Simulate progress milestone (25%)
    progressCallback({
      type: 'reading_progress_sync',
      bookId: 'book-123',
      bookTitle: 'Test Book',
      progress: 25,
      lastReadPosition: 'chapter-2',
      status: 'owned'
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    })
  })

  it('should handle activity feed notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    const activityCallback = mockRealtimeService.subscribeToActivityFeed.mock.calls[0][1]
    
    activityCallback({
      type: 'activity_feed',
      activityType: 'book_completed',
      userId: 'other-user',
      userDisplayName: 'Other User',
      itemId: 'book-123',
      itemTitle: 'Test Book',
      metadata: { progress: 100 }
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    })
  })

  it('should mark notifications as read', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    // Add a notification first
    const purchaseCallback = mockRealtimeService.subscribeToPurchaseUpdates.mock.calls[0][1]
    purchaseCallback({
      type: 'purchase_status_update',
      purchaseId: 'purchase-123',
      status: 'approved',
      itemType: 'book',
      itemId: 'book-123',
      itemTitle: 'Test Book'
    })

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')
    })

    // Mark as read
    screen.getByText('Mark All as Read').click()

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    })
  })

  it('should clear notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    // Add a notification first
    const purchaseCallback = mockRealtimeService.subscribeToPurchaseUpdates.mock.calls[0][1]
    purchaseCallback({
      type: 'purchase_status_update',
      purchaseId: 'purchase-123',
      status: 'approved',
      itemType: 'book',
      itemId: 'book-123',
      itemTitle: 'Test Book'
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    })

    // Clear all notifications
    screen.getByText('Clear All').click()

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })
  })

  it('should update configuration', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    screen.getByText('Update Config').click()

    expect(mockRealtimeService.updateConfig).toHaveBeenCalledWith({
      enablePurchaseUpdates: false
    })
  })

  it('should cleanup subscriptions on unmount', () => {
    const { unmount } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    unmount()

    expect(mockRealtimeService.unsubscribe).toHaveBeenCalledTimes(3) // purchase, progress, activity
  })
})