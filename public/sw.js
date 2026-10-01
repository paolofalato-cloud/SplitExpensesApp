// Service Worker per la gestione delle notifiche Web Push
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body || 'Nuova spesa registrata nel gruppo',
      icon: data.icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.data?.url || '/',
      },
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'SplitExpenses 💸', options)
    )
  } catch (err) {
    console.error('Errore durante la gestione dell\'evento Push:', err)
  }
})

// Gestione del click sulla notifica
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})