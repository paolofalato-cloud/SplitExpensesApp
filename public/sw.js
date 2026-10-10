// Listener per le notifiche Push in arrivo
self.addEventListener('push', (event) => {
  let data = {}

  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    console.error('Errore parsing JSON notifica push:', e)
    data = { title: 'SplitExpenses', body: event.data ? event.data.text() : 'Nuova attività nel gruppo!' }
  }

  const title = data.title || 'SplitExpenses 💸'
  const options = {
    body: data.body || 'Nuova spesa o aggiornamento nel tuo gruppo.',
    icon: '/pwa-192x192.png', // Sostituisci con il percorso della tua icona
    badge: '/badge.png',        // Opzionale: icona monocromatica per la barra notifiche
    data: data.url || '/',
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Listener per il click sulla notifica (apre l'app)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se l'app è già aperta in una scheda, portala in primo piano
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Altrimenti apri una nuova finestra/scheda
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})