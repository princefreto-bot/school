/*
* Service Worker pour les notifications Web Push
*/

self.addEventListener('push', (event) => {
  let data = { title: 'Notification', body: 'Vous avez un nouveau message.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.log('Push event data is not JSON, treating as text', e);
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Assurez-vous que cette icône existe
    badge: '/icon-192x192.png',
    tag: 'presence-notification',
    renotify: true,
    requireInteraction: true,
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // On ramène l'app au premier plan ou on ouvre l'onglet
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
