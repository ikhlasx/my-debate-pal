// Service Worker registration utilities for Push Notifications

let swRegistration: ServiceWorkerRegistration | null = null;

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker not supported in this browser');
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    swRegistration = registration;
    console.log('[SW] Service Worker registered successfully:', registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('[SW] Service Worker is ready');

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] Service Worker update found');

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('[SW] New Service Worker installed, ready to activate');
              // Dispatch custom event for UI to handle
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            } else {
              // First install
              console.log('[SW] Service Worker installed for the first time');
            }
          }
        });
      }
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, new Service Worker active');
    });

    // Check for updates periodically (every 30 minutes)
    setInterval(() => {
      registration.update().catch((err) => {
        console.warn('[SW] Failed to check for updates:', err);
      });
    }, 30 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
    return null;
  }
};

export const getServiceWorkerRegistration = (): ServiceWorkerRegistration | null => {
  return swRegistration;
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('[SW] Service Worker unregistered:', success);
    swRegistration = null;
    return success;
  } catch (error) {
    console.error('[SW] Service Worker unregistration failed:', error);
    return false;
  }
};

export const checkServiceWorkerStatus = (): {
  supported: boolean;
  registered: boolean;
  active: boolean;
  pushSupported: boolean;
} => {
  const supported = 'serviceWorker' in navigator;
  const registered = supported && navigator.serviceWorker.controller !== null;
  const active = supported && navigator.serviceWorker.controller?.state === 'activated';
  const pushSupported = supported && 'PushManager' in window;

  return { supported, registered, active, pushSupported };
};

// Skip waiting and activate new service worker immediately
export const skipWaiting = (): void => {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
};

// Post message to service worker
export const postMessageToSW = (message: any): void => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
};
