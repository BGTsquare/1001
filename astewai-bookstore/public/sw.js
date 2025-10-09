// Enhanced Service Worker for PWA functionality
// Bumped cache names to force cache invalidation when this file changes
const CACHE_NAME = 'astewai-bookstore-v3'
const STATIC_CACHE = 'static-v3'
const DYNAMIC_CACHE = 'dynamic-v3'
const IMAGE_CACHE = 'images-v3'

// Critical resources to cache immediately
const urlsToCache = [
  '/',
  '/offline',
  '/books',
  '/bundles',
  '/auth/login',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json'
]

// Resources to cache on first access
const dynamicCacheUrls = [
  '/api/books',
  '/api/bundles',
  '/api/profile'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
  // Activate this service worker immediately and take control
  self.skipWaiting()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  
  if (!event.data) {
    console.log('Push event has no data')
    return
  }

  let notificationData
  try {
    notificationData = event.data.json()
  } catch (error) {
    console.error('Error parsing push data:', error)
    notificationData = {
      title: 'Astewai Bookstore',
      body: event.data.text() || 'You have a new notification',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    tag: notificationData.tag || 'default',
    data: notificationData.data || {},
    actions: notificationData.actions || [],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate: notificationData.vibrate || [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  const action = event.action
  const data = event.notification.data || {}
  
  let url = '/'
  
  // Handle different notification types and actions
  if (action === 'view' && data.type === 'purchase_status_update') {
    url = '/profile?tab=purchases'
  } else if (action === 'approve' && data.type === 'admin_approval_required') {
    url = '/admin/purchase-requests'
  } else if (action === 'continue' && data.type === 'reading_progress_sync') {
    url = `/library/read/${data.bookId}`
  } else if (data.url) {
    url = data.url
  } else if (data.type === 'purchase_status_update') {
    url = '/profile?tab=purchases'
  } else if (data.type === 'admin_approval_required') {
    url = '/admin'
  } else if (data.type === 'reading_progress_sync') {
    url = '/library'
  } else if (data.type === 'activity_feed') {
    url = '/'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag)
  
  if (event.tag === 'sync-reading-progress') {
    event.waitUntil(syncReadingProgress())
  } else if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

// Sync reading progress when back online
async function syncReadingProgress() {
  try {
    // Get pending progress updates from IndexedDB or localStorage
    const pendingUpdates = JSON.parse(localStorage.getItem('pending-progress-updates') || '[]')
    
    if (pendingUpdates.length === 0) {
      return
    }

    // Send updates to server
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/library/sync-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update)
        })

        if (response.ok) {
          // Remove successfully synced update
          const index = pendingUpdates.indexOf(update)
          if (index > -1) {
            pendingUpdates.splice(index, 1)
          }
        }
      } catch (error) {
        console.error('Failed to sync progress update:', error)
      }
    }

    // Update localStorage with remaining pending updates
    localStorage.setItem('pending-progress-updates', JSON.stringify(pendingUpdates))
    
    console.log('Reading progress sync completed')
  } catch (error) {
    console.error('Error during reading progress sync:', error)
  }
}

// Sync notifications when back online
async function syncNotifications() {
  try {
    // Fetch latest notifications from server
    const response = await fetch('/api/notifications')
    
    if (response.ok) {
      const notifications = await response.json()
      
      // Store notifications in cache for offline access
      const cache = await caches.open(CACHE_NAME)
      await cache.put('/api/notifications', new Response(JSON.stringify(notifications)))
      
      console.log('Notifications sync completed')
    }
  } catch (error) {
    console.error('Error during notifications sync:', error)
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'SYNC_PROGRESS') {
    // Trigger background sync for reading progress
    self.registration.sync.register('sync-reading-progress')
  } else if (event.data && event.data.type === 'SYNC_NOTIFICATIONS') {
    // Trigger background sync for notifications
    self.registration.sync.register('sync-notifications')
  }
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})