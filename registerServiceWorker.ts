// Service Worker Registration for offline resilience
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // In dev environments or production, register gracefully
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[SW] New version available for FloodGuard AI.');
                  } else {
                    console.log('[SW] Content cached for offline telemetry operations.');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          // Gracefully suppress in restricted iframe contexts
          console.debug('[SW] Service worker registration skipped or restricted:', err);
        });
    });
  }
}
