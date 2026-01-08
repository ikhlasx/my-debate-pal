import { useState, useCallback, useRef, useEffect } from 'react';
import { Toast, ToastType, Partner } from '@/types/debate';

const generateId = () => Math.random().toString(36).substring(2, 9);

const ICONS: Record<string, string> = {
  debate_start_husband: '💙',
  debate_start_wife: '💗',
  debate_end: '✅',
  both_active: '⚠️',
  milestone_5: '⏰',
  milestone_15: '⏰',
  milestone_30: '🚨',
  record: '🏆',
  peaceful: '🕊️',
};

export const useNotifications = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isAppVisibleRef = useRef(true);
  const notifiedMilestonesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const handleVisibilityChange = () => {
      isAppVisibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message: string, icon?: string) => {
    const toast: Toast = {
      id: generateId(),
      type,
      title,
      message,
      icon,
      timestamp: Date.now(),
      duration: 5000,
    };

    setToasts(prev => [...prev, toast]);

    // Auto dismiss
    setTimeout(() => {
      dismissToast(toast.id);
    }, toast.duration);

    return toast;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (permission !== 'granted' || isAppVisibleRef.current) {
      return null;
    }

    try {
      return new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (e) {
      console.error('Failed to show notification:', e);
      return null;
    }
  }, [permission]);

  const notifyDebateStart = useCallback((partner: Partner) => {
    const isHusband = partner === 'husband';
    const icon = isHusband ? ICONS.debate_start_husband : ICONS.debate_start_wife;
    const title = `${isHusband ? 'Husband' : 'Wife'} Started a Debate`;
    const type: ToastType = 'info';

    addToast(type, title, 'Timer is now running...', icon);

    if (!isAppVisibleRef.current) {
      showBrowserNotification('Debate Started', `${isHusband ? 'Husband' : 'Wife'} has initiated a debate session`);
    }

    // Reset milestones for this partner
    notifiedMilestonesRef.current.delete(`${partner}-5`);
    notifiedMilestonesRef.current.delete(`${partner}-15`);
    notifiedMilestonesRef.current.delete(`${partner}-30`);
  }, [addToast, showBrowserNotification]);

  const notifyDebateEnd = useCallback((partner: Partner, duration: number) => {
    const isHusband = partner === 'husband';
    const formattedDuration = formatDuration(duration);
    const title = `${isHusband ? 'Husband' : 'Wife'} Ended Debate`;

    addToast('success', title, `Duration: ${formattedDuration}`, ICONS.debate_end);

    if (!isAppVisibleRef.current) {
      showBrowserNotification('Debate Ended', `${isHusband ? 'Husband' : 'Wife'}'s session completed. Duration: ${formattedDuration}`);
    }
  }, [addToast, showBrowserNotification]);

  const notifyBothActive = useCallback(() => {
    addToast('warning', 'Both Partners Debating!', 'This might get interesting...', ICONS.both_active);

    if (!isAppVisibleRef.current) {
      showBrowserNotification('⚠️ Both Debating!', 'Both partners are now actively debating');
    }
  }, [addToast, showBrowserNotification]);

  const checkMilestones = useCallback((partner: Partner, seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const milestones = [5, 15, 30];

    for (const milestone of milestones) {
      const key = `${partner}-${milestone}`;
      if (minutes === milestone && !notifiedMilestonesRef.current.has(key)) {
        notifiedMilestonesRef.current.add(key);

        const isHusband = partner === 'husband';
        const icon = milestone >= 30 ? ICONS.milestone_30 : milestone >= 15 ? ICONS.milestone_15 : ICONS.milestone_5;
        const type: ToastType = milestone >= 30 ? 'error' : milestone >= 15 ? 'warning' : 'info';
        const title = milestone >= 30 ? 'Extended Debate Alert!' : 'Time Milestone';
        const message = `${isHusband ? 'Husband' : 'Wife'}'s debate: ${milestone} minutes`;

        addToast(type, title, message, icon);

        if (!isAppVisibleRef.current) {
          showBrowserNotification(`⏰ ${title}`, message);
        }
      }
    }
  }, [addToast, showBrowserNotification]);

  return {
    toasts,
    permission,
    requestPermission,
    addToast,
    dismissToast,
    notifyDebateStart,
    notifyDebateEnd,
    notifyBothActive,
    checkMilestones,
  };
};

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
};

export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
