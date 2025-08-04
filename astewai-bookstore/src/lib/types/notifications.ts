// Real-time notification types
export interface BaseNotificationData {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: string
  expiresAt?: string
}

// Discriminated union for type-safe notifications
export type NotificationData = 
  | (BaseNotificationData & PurchaseStatusNotification)
  | (BaseNotificationData & AdminApprovalNotification)
  | (BaseNotificationData & ReadingProgressNotification)
  | (BaseNotificationData & ActivityFeedNotification)
  | (BaseNotificationData & SystemNotification)

export type NotificationType = 
  | 'purchase_status_update'
  | 'admin_approval_required'
  | 'reading_progress_sync'
  | 'activity_feed'
  | 'system_notification'

// Shared types for consistency
export type ItemType = 'book' | 'bundle'
export type PurchaseStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type BookStatus = 'owned' | 'pending' | 'completed'
export type Priority = 'low' | 'medium' | 'high'
export type SystemCategory = 'maintenance' | 'feature' | 'security' | 'general'
export type ActivityType = 'book_added' | 'book_completed' | 'review_posted' | 'bundle_purchased'

// Common data structures
export interface ItemReference {
  itemType: ItemType
  itemId: string
  itemTitle: string
}

export interface UserReference {
  userId: string
  userDisplayName: string
}

export interface PurchaseStatusNotification extends ItemReference {
  type: 'purchase_status_update'
  purchaseId: string
  status: PurchaseStatus
}

export interface AdminApprovalNotification extends ItemReference, UserReference {
  type: 'admin_approval_required'
  requestId: string
  requestType: 'purchase_request'
  amount: number
}

export interface ReadingProgressNotification {
  type: 'reading_progress_sync'
  bookId: string
  bookTitle: string
  progress: number
  lastReadPosition?: string
  status: BookStatus
}

export interface ActivityFeedNotification extends UserReference {
  type: 'activity_feed'
  activityType: ActivityType
  itemId?: string
  itemTitle?: string
  metadata?: Record<string, unknown>
}

export interface SystemNotification {
  type: 'system_notification'
  priority: Priority
  category: SystemCategory
}

// Real-time subscription types
export interface RealtimeSubscription<T = unknown> {
  id: string
  channel: string
  event: string
  callback: (payload: T) => void
  cleanup: () => void
}

export interface RealtimeConfig {
  enablePurchaseUpdates: boolean
  enableAdminNotifications: boolean
  enableProgressSync: boolean
  enableActivityFeed: boolean
  enablePushNotifications: boolean
}

// Push notification types
export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: PushNotificationAction[]
  /** Time to live in seconds */
  ttl?: number
  /** Urgency level for delivery */
  urgency?: 'very-low' | 'low' | 'normal' | 'high'
}

export interface PushNotificationAction {
  action: string
  title: string
  icon?: string
}

// Database entity - matches Supabase schema naming
export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at: string
  updated_at: string
}

// Client-side type with camelCase for consistency
export interface PushSubscriptionData {
  id: string
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}
// Ut
ility types for better type inference
export type NotificationByType<T extends NotificationType> = Extract<NotificationData, { type: T }>

// Type guards for runtime type checking
export const isNotificationType = (type: string): type is NotificationType => {
  return ['purchase_status_update', 'admin_approval_required', 'reading_progress_sync', 'activity_feed', 'system_notification'].includes(type)
}

export const isPurchaseStatusNotification = (notification: NotificationData): notification is NotificationByType<'purchase_status_update'> => {
  return notification.type === 'purchase_status_update'
}

export const isAdminApprovalNotification = (notification: NotificationData): notification is NotificationByType<'admin_approval_required'> => {
  return notification.type === 'admin_approval_required'
}

export const isReadingProgressNotification = (notification: NotificationData): notification is NotificationByType<'reading_progress_sync'> => {
  return notification.type === 'reading_progress_sync'
}

// Notification factory types for creating notifications
export interface NotificationFactory {
  createPurchaseStatusNotification: (data: Omit<PurchaseStatusNotification, 'type'>) => PurchaseStatusNotification
  createAdminApprovalNotification: (data: Omit<AdminApprovalNotification, 'type'>) => AdminApprovalNotification
  createReadingProgressNotification: (data: Omit<ReadingProgressNotification, 'type'>) => ReadingProgressNotification
  createActivityFeedNotification: (data: Omit<ActivityFeedNotification, 'type'>) => ActivityFeedNotification
  createSystemNotification: (data: Omit<SystemNotification, 'type'>) => SystemNotification
}

// Event payload types for real-time subscriptions
export interface NotificationEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: NotificationData
  old?: NotificationData
}

export interface RealtimeEventPayload<T = NotificationData> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: T
  old?: T
  errors?: string[]
}