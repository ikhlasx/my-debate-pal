// Push Notification Manager for Browser Push Notifications
// Handles subscription management and push notification sending

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime: number | null;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  vibrate?: number[];
  silent?: boolean;
}

// Generate VAPID keys for push notifications
// In production, you should generate these once and store them securely
// For demo purposes, we'll use a placeholder - in real app, get from backend
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Wait for service worker to be ready
      this.registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready for push notifications');

      // Check existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('Existing push subscription found');
        this.saveSubscriptionToStorage(this.subscription);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  public async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.registration) {
      console.error('Push notifications not supported or not initialized');
      return null;
    }

    // First, request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    try {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('Push subscription created:', this.subscription);
      this.saveSubscriptionToStorage(this.subscription);

      // In a real app, you would send this subscription to your backend
      // await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.warn('No active push subscription');
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        console.log('Push subscription removed');
        this.subscription = null;
        localStorage.removeItem('push-subscription');
        
        // In a real app, you would notify your backend
        // await this.removeSubscriptionFromServer();
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  public getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  public isSubscribed(): boolean {
    return this.subscription !== null;
  }

  public getSubscriptionData(): PushSubscriptionData | null {
    if (!this.subscription) return null;

    const subscriptionJson = this.subscription.toJSON();
    
    return {
      endpoint: this.subscription.endpoint,
      keys: {
        p256dh: subscriptionJson.keys?.p256dh || '',
        auth: subscriptionJson.keys?.auth || '',
      },
      expirationTime: this.subscription.expirationTime,
    };
  }

  // Send a local push notification (simulated - for testing)
  public async sendLocalNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag || 'debate-notification',
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || [100, 50, 100],
        silent: payload.silent || false,
      });

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  // Post message to service worker
  public postMessage(message: any): void {
    if (this.registration?.active) {
      this.registration.active.postMessage(message);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  private saveSubscriptionToStorage(subscription: PushSubscription): void {
    try {
      localStorage.setItem('push-subscription', JSON.stringify(subscription.toJSON()));
    } catch (error) {
      console.error('Failed to save subscription to storage:', error);
    }
  }

  // For backend integration (placeholder)
  // private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  //   const response = await fetch('/api/push/subscribe', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(subscription.toJSON()),
  //   });
  //   if (!response.ok) throw new Error('Failed to save subscription on server');
  // }
}

// Singleton instance
export const pushNotificationManager = new PushNotificationManager();

