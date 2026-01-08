import { useState, useEffect, useCallback } from 'react';
import { pushNotificationManager, PushNotificationPayload } from '@/lib/PushNotificationManager';

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
    error: null,
  });

  // Initialize push notifications
  useEffect(() => {
    const init = async () => {
      try {
        const isSupported = pushNotificationManager.getIsSupported();
        
        if (!isSupported) {
          setState({
            isSupported: false,
            isSubscribed: false,
            permission: 'default',
            isLoading: false,
            error: 'Push notifications are not supported in this browser',
          });
          return;
        }

        // Get current permission
        const permission = Notification.permission;

        // Initialize the manager
        await pushNotificationManager.initialize();

        setState({
          isSupported: true,
          isSubscribed: pushNotificationManager.isSubscribed(),
          permission,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize',
        }));
      }
    };

    init();

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        console.log('Notification clicked, navigating to:', event.data.navigateTo);
        // Handle navigation if needed
        if (event.data.navigateTo && window.location.pathname !== event.data.navigateTo) {
          window.location.href = event.data.navigateTo;
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await pushNotificationManager.subscribe();
      
      if (subscription) {
        setState((prev) => ({
          ...prev,
          isSubscribed: true,
          permission: 'granted',
          isLoading: false,
        }));
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isSubscribed: false,
          permission: Notification.permission,
          isLoading: false,
          error: Notification.permission === 'denied' 
            ? 'Notification permission was denied' 
            : 'Failed to subscribe',
        }));
        return false;
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      }));
      return false;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await pushNotificationManager.unsubscribe();
      
      setState((prev) => ({
        ...prev,
        isSubscribed: !success,
        isLoading: false,
      }));
      
      return success;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
      }));
      return false;
    }
  }, []);

  // Send a test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      return await pushNotificationManager.sendLocalNotification({
        title: '🔔 Test Notification',
        body: 'Push notifications are working! You\'ll receive alerts even when the app is in the background.',
        icon: '/favicon.ico',
        tag: 'test-notification',
        vibrate: [100, 50, 100, 50, 200],
        data: {
          url: '/',
          type: 'test',
        },
      });
    } catch (error) {
      console.error('Test notification error:', error);
      return false;
    }
  }, []);

  // Send a custom notification
  const sendNotification = useCallback(async (payload: PushNotificationPayload): Promise<boolean> => {
    try {
      return await pushNotificationManager.sendLocalNotification(payload);
    } catch (error) {
      console.error('Send notification error:', error);
      return false;
    }
  }, []);

  // Request permission only (without subscribing)
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    setState((prev) => ({ ...prev, permission }));
    return permission;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
    sendNotification,
    requestPermission,
    clearError,
  };
};

