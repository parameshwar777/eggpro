// EggPro Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  let data = { title: '🥚 New Order!', body: 'You have a new order', icon: '/favicon.ico' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body || 'You have a new order',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [300, 100, 300, 100, 300],
    tag: 'order-notification',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'view', title: '📋 View Orders' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { url: '/merchant/orders' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🥚 New Order!', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const action = event.action;
  const url = event.notification.data?.url || '/merchant/orders';

  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes('/merchant') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
