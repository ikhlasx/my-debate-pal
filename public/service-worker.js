// Service Worker for handling push notifications
// Enhanced version with better push handling and offline support

const CACHE_NAME = 'debate-tracker-v2';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/placeholder.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // Return offline page if available
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return null;
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  let data = {
    title: 'Debate Tracker',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'debate-notification',
    requireInteraction: false,
    vibrate: [100, 50, 100],
    data: {},
  };

  // Parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
      // Try as text
      try {
        data.body = event.data.text();
      } catch (textError) {
        console.error('[SW] Failed to read push data as text:', textError);
      }
    }
  }

  // Notification options
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || `debate-${Date.now()}`,
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [100, 50, 100],
    data: {
      url: data.data?.url || '/',
      navigateTo: data.data?.navigateTo,
      timestamp: Date.now(),
      ...data.data,
    },
    actions: data.actions || [
      { action: 'view', title: 'View', icon: '/favicon.ico' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle dismiss action
  if (action === 'dismiss') {
    return;
  }

  // Handle view action or default click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window/tab
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus existing window and navigate if needed
            return client.focus().then((focusedClient) => {
              if (data.navigateTo && focusedClient.postMessage) {
                focusedClient.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  navigateTo: data.navigateTo,
                  data: data,
                });
              }
              return focusedClient;
            });
          }
        }

        // No existing window, open a new one
        if (clients.openWindow) {
          const url = data.navigateTo || data.url || '/';
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  // Track notification dismissal if needed
  const notification = event.notification;
  const data = notification.data || {};
  
  // Could send analytics here
  console.log('[SW] Notification dismissed:', data.tag || 'unknown');
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'SHOW_NOTIFICATION':
      // Show notification from main app
      if (payload) {
        self.registration.showNotification(payload.title || 'Debate Tracker', {
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: payload.tag || 'debate-notification',
          data: payload.data,
          requireInteraction: payload.requireInteraction || false,
          vibrate: payload.vibrate || [100, 50, 100],
        });
      }
      break;

    case 'GET_SUBSCRIPTION':
      // Return current push subscription
      self.registration.pushManager.getSubscription()
        .then((subscription) => {
          event.ports[0]?.postMessage({
            type: 'SUBSCRIPTION',
            subscription: subscription ? subscription.toJSON() : null,
          });
        });
      break;

    case 'CLEAR_NOTIFICATIONS':
      // Clear all notifications with specific tag
      self.registration.getNotifications({ tag: payload?.tag })
        .then((notifications) => {
          notifications.forEach((notification) => notification.close());
        });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Push subscription change event
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed:', event);
  
  // Re-subscribe if subscription expired
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Note: In production, get the applicationServerKey from your backend
    })
    .then((subscription) => {
      console.log('[SW] Re-subscribed to push:', subscription);
      // Send new subscription to server
      // return fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription.toJSON()),
      // });
    })
    .catch((error) => {
      console.error('[SW] Failed to re-subscribe:', error);
    })
  );
});

// Periodic sync event (for scheduled notifications)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'daily-summary') {
    event.waitUntil(
      // Check if it's time for daily summary
      checkDailySummary()
    );
  }
  
  if (event.tag === 'weekly-summary') {
    event.waitUntil(
      checkWeeklySummary()
    );
  }
});

// Helper functions for scheduled notifications
async function checkDailySummary() {
  // This would typically fetch data from your backend
  // For now, we'll just log
  console.log('[SW] Checking daily summary...');
}

async function checkWeeklySummary() {
  console.log('[SW] Checking weekly summary...');
}

console.log('[SW] Service worker loaded');
