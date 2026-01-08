import { useState, useCallback, useRef, useEffect } from 'react';
import { Toast, ToastType, Partner, NotificationSettings } from '@/types/debate';
import { NotificationManager } from '@/lib/NotificationManager';
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration';

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_SETTINGS: NotificationSettings = {
  inAppEnabled: true,
  browserEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 0.8,
  quietHours: {
    enabled: true,
    start: '23:00',
    end: '07:00',
  },
  timeMilestones: [5, 15, 30],
  dailySummary: { enabled: true, time: '21:00' },
  weeklySummary: { enabled: true, day: 1, time: '09:00' },
};

const ICONS: Record<string, string> = {
  debate_start: '🔴',
  debate_end: '✅',
  both_active: '⚠️',
  milestone_5min: '⏰',
  milestone_15min: '⏰',
  milestone_30min: '🚨',
  new_record: '🏆',
  peaceful_day: '🕊️',
  streak: '🔥',
  daily_summary: '📊',
  weekly_summary: '📈',
  info: '💙',
  success: '✅',
  warning: '⚠️',
  error: '🚨',
};

const getToastType = (notificationType: string): ToastType => {
  if (notificationType.includes('error') || notificationType.includes('30min')) return 'error';
  if (notificationType.includes('warning') || notificationType.includes('both_active') || notificationType.includes('15min')) return 'warning';
  if (notificationType.includes('success') || notificationType.includes('end') || notificationType.includes('record')) return 'success';
  return 'info';
};

export const useEnhancedNotifications = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('notification-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const notificationManagerRef = useRef<NotificationManager | null>(null);
  const notifiedMilestonesRef = useRef<Set<string>>(new Set());

  // Initialize NotificationManager
  useEffect(() => {
    const handleToast = (type: string, title: string, message: string, data?: any) => {
      const toast: Toast = {
        id: generateId(),
        type: getToastType(type),
        title,
        message,
        icon: ICONS[type] || ICONS[getToastType(type)],
        timestamp: Date.now(),
        duration: 5000,
      };

      setToasts(prev => [...prev, toast]);

      // Auto dismiss
      setTimeout(() => {
        dismissToast(toast.id);
      }, toast.duration);
    };

    notificationManagerRef.current = new NotificationManager(
      settings,
      handleToast,
      (path: string) => {
        // Handle navigation if needed
        console.log('Navigate to:', path);
      }
    );

    return () => {
      // Cleanup if needed
    };
  }, [settings]);

  // Register service worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);

      // Show permission modal if permission is default and user hasn't been asked before
      const hasAsked = localStorage.getItem('notification-permission-asked');
      if (Notification.permission === 'default' && !hasAsked) {
        // Show modal after a short delay on first load
        setTimeout(() => {
          setShowPermissionModal(true);
        }, 3000);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
    if (notificationManagerRef.current) {
      notificationManagerRef.current.updateSettings(settings);
    }
  }, [settings]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    localStorage.setItem('notification-permission-asked', 'true');

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted' && notificationManagerRef.current) {
      // Send test notification
      await notificationManagerRef.current.sendTestNotification();
    }

    setShowPermissionModal(false);
    return result === 'granted';
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const notifyDebateStart = useCallback((partner: Partner) => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.onToggleOn(partner);

    // Reset milestones for this partner
    notifiedMilestonesRef.current.delete(`${partner}-5`);
    notifiedMilestonesRef.current.delete(`${partner}-15`);
    notifiedMilestonesRef.current.delete(`${partner}-30`);
  }, []);

  const notifyDebateEnd = useCallback((partner: Partner, duration: number) => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.onToggleOff(partner, duration);
  }, []);

  const notifyBothActive = useCallback(() => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.onBothActive();
  }, []);

  const checkMilestones = useCallback((partner: Partner, seconds: number) => {
    if (!notificationManagerRef.current) return;

    const minutes = Math.floor(seconds / 60);

    for (const milestone of settings.timeMilestones) {
      const key = `${partner}-${milestone}`;
      if (minutes === milestone && !notifiedMilestonesRef.current.has(key)) {
        notifiedMilestonesRef.current.add(key);
        notificationManagerRef.current.checkTimeMilestone(partner, seconds);
      }
    }
  }, [settings.timeMilestones]);

  const sendDailySummary = useCallback((stats: {
    totalDebates: number;
    totalTime: number;
    husbandDebates: number;
    wifeDebates: number;
  }) => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.sendDailySummary(stats);
  }, []);

  const sendWeeklySummary = useCallback((stats: {
    totalDebates: number;
    totalTime: number;
    husbandPercentage: number;
    wifePercentage: number;
  }) => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.sendWeeklySummary(stats);
  }, []);

  const notifyNewRecord = useCallback((recordType: string, value: string) => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.notifyNewRecord(recordType, value);
  }, []);

  const notifyPeacefulDay = useCallback(() => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.notifyPeacefulDay();
  }, []);

  const notifyStreak = useCallback((days: number) => {
    if (!notificationManagerRef.current) return;

    notificationManagerRef.current.notifyStreak(days);
  }, []);

  const testSound = useCallback(() => {
    if (!notificationManagerRef.current) return;
    notificationManagerRef.current['soundPlayer'].test();
  }, []);

  const testVibration = useCallback(() => {
    if ('vibrate' in navigator && settings.vibrationEnabled) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [settings.vibrationEnabled]);

  const testNotification = useCallback(async () => {
    if (Notification.permission === 'default') {
      await requestPermission();
    } else if (notificationManagerRef.current) {
      await notificationManagerRef.current.sendTestNotification();
    }
  }, [requestPermission]);

  return {
    // State
    toasts,
    permission,
    settings,
    showPermissionModal,

    // Actions
    requestPermission,
    dismissToast,
    updateSettings,
    setShowPermissionModal,

    // Notification methods
    notifyDebateStart,
    notifyDebateEnd,
    notifyBothActive,
    checkMilestones,
    sendDailySummary,
    sendWeeklySummary,
    notifyNewRecord,
    notifyPeacefulDay,
    notifyStreak,

    // Test methods
    testSound,
    testVibration,
    testNotification,
  };
};
