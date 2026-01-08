import { NotificationSettings, Partner } from '@/types/debate';
import { SoundPlayer } from './SoundPlayer';

interface NotificationData {
  type: string;
  priority?: 'low' | 'medium' | 'high';
  icon?: string;
  navigateTo?: string;
  requireInteraction?: boolean;
  data?: any;
}

export class NotificationManager {
  private settings: NotificationSettings;
  private soundPlayer: SoundPlayer;
  private isAppVisible: boolean;
  private onToastCallback?: (type: string, title: string, message: string, data?: any) => void;
  private onNavigateCallback?: (path: string) => void;

  constructor(
    settings: NotificationSettings,
    onToast?: (type: string, title: string, message: string, data?: any) => void,
    onNavigate?: (path: string) => void
  ) {
    this.settings = settings;
    this.soundPlayer = new SoundPlayer();
    this.isAppVisible = document.visibilityState === 'visible';
    this.onToastCallback = onToast;
    this.onNavigateCallback = onNavigate;

    // Monitor app visibility
    document.addEventListener('visibilitychange', () => {
      this.isAppVisible = document.visibilityState === 'visible';
    });
  }

  updateSettings(settings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.soundPlayer.setVolume(this.settings.volume);
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async notify(
    type: string,
    title: string,
    message: string,
    data: NotificationData = {}
  ): Promise<void> {
    // Check quiet hours
    if (this.isQuietHours()) {
      console.log('Skipping notification during quiet hours:', title);
      return;
    }

    // In-App Notification (always if enabled and app is visible)
    if (this.settings.inAppEnabled && this.isAppVisible) {
      this.showToast(type, title, message, data);
    }

    // Browser/OS Notification (only if app is hidden and enabled)
    if (this.settings.browserEnabled && !this.isAppVisible) {
      await this.showBrowserNotification(title, message, data);
    }

    // Sound
    if (this.settings.soundEnabled) {
      this.playSound(type, data.priority);
    }

    // Vibration (mobile only)
    if (this.settings.vibrationEnabled && this.isMobile()) {
      this.vibrate(type);
    }
  }

  private showToast(
    type: string,
    title: string,
    message: string,
    data: NotificationData
  ): void {
    if (this.onToastCallback) {
      this.onToastCallback(type, title, message, data);
    }
  }

  private async showBrowserNotification(
    title: string,
    body: string,
    data: NotificationData = {}
  ): Promise<Notification | null> {
    // Check permission
    if (Notification.permission !== 'granted') {
      console.log('Browser notification permission not granted');
      return null;
    }

    try {
      const options: NotificationOptions = {
        body,
        icon: data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `debate-${data.type || 'notification'}`,
        requireInteraction: data.requireInteraction || false,
        silent: false,
        data: {
          url: window.location.origin,
          navigateTo: data.navigateTo,
          ...data.data,
        },
      };

      const notification = new Notification(title, options);

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();

        // Navigate to relevant section
        if (data.navigateTo && this.onNavigateCallback) {
          this.onNavigateCallback(data.navigateTo);
        }
      };

      return notification;
    } catch (error) {
      console.error('Failed to show browser notification:', error);
      return null;
    }
  }

  private playSound(type: string, priority: string = 'medium'): void {
    if (!this.settings.soundEnabled || this.isQuietHours()) {
      return;
    }

    this.soundPlayer.play(type);
  }

  private vibrate(type: string): void {
    if (!this.settings.vibrationEnabled || !navigator.vibrate) {
      return;
    }
    if (this.isQuietHours()) {
      return;
    }

    const patterns: Record<string, number[]> = {
      debate_start: [100],
      debate_end: [200],
      both_active: [100, 50, 100],
      milestone_5min: [50],
      milestone_15min: [100, 50, 100],
      milestone_30min: [200, 100, 200, 100, 200],
      new_record: [100, 50, 100, 50, 200],
      daily_summary: [150],
      weekly_summary: [150],
    };

    const pattern = patterns[type] || [100];
    navigator.vibrate(pattern);
  }

  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const start = this.settings.quietHours.start;
    const end = this.settings.quietHours.end;

    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    // Handle overnight quiet hours (e.g., 23:00 to 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Event Handlers
  onToggleOn(person: Partner): void {
    const personName = person === 'husband' ? 'Husband' : 'Wife';
    this.notify(
      'debate_start',
      'Debate Started',
      `${personName} has initiated a debate session`,
      {
        type: 'debate_start',
        priority: 'medium',
        icon: '/favicon.ico',
        navigateTo: '/',
      }
    );
  }

  onToggleOff(person: Partner, duration: number): void {
    const personName = person === 'husband' ? 'Husband' : 'Wife';
    const formattedDuration = this.formatDuration(duration);

    this.notify(
      'debate_end',
      'Debate Ended',
      `${personName}'s session completed. Duration: ${formattedDuration}`,
      {
        type: 'debate_end',
        priority: 'low',
        icon: '/favicon.ico',
      }
    );
  }

  onBothActive(): void {
    this.notify(
      'both_active',
      'Both Debating!',
      'Both partners are now actively debating',
      {
        type: 'both_active',
        priority: 'high',
        requireInteraction: true,
        icon: '/favicon.ico',
      }
    );
  }

  checkTimeMilestone(person: Partner, duration: number): void {
    const minutes = Math.floor(duration / 60);
    const personName = person === 'husband' ? 'Husband' : 'Wife';

    if (this.settings.timeMilestones.includes(minutes)) {
      const priority = minutes >= 30 ? 'high' : 'medium';
      const emoji = minutes >= 30 ? '🚨' : '⏰';

      this.notify(
        `milestone_${minutes}min`,
        `${emoji} Time Alert`,
        `${personName}'s debate has been ongoing for ${minutes} minutes`,
        {
          type: `milestone_${minutes}min`,
          priority,
          navigateTo: '/',
        }
      );
    }
  }

  sendDailySummary(stats: {
    totalDebates: number;
    totalTime: number;
    husbandDebates: number;
    wifeDebates: number;
  }): void {
    if (!this.settings.dailySummary.enabled) {
      return;
    }

    const formattedTime = this.formatDuration(stats.totalTime);

    this.notify(
      'daily_summary',
      '📊 Daily Summary',
      `${stats.totalDebates} debates today (${formattedTime}). Tap to view details.`,
      {
        type: 'daily_summary',
        priority: 'low',
        navigateTo: '/calendar',
        data: stats,
      }
    );
  }

  sendWeeklySummary(stats: {
    totalDebates: number;
    totalTime: number;
    husbandPercentage: number;
    wifePercentage: number;
  }): void {
    if (!this.settings.weeklySummary.enabled) {
      return;
    }

    const formattedTime = this.formatDuration(stats.totalTime);
    const initiator = stats.wifePercentage > stats.husbandPercentage ? 'Wife' : 'Husband';
    const percentage = Math.max(stats.wifePercentage, stats.husbandPercentage);

    this.notify(
      'weekly_summary',
      '📈 Weekly Debate Report',
      `Last week: ${stats.totalDebates} debates, ${formattedTime} total. ${initiator} initiated ${percentage}%.`,
      {
        type: 'weekly_summary',
        priority: 'low',
        navigateTo: '/calendar',
        data: stats,
      }
    );
  }

  notifyNewRecord(recordType: string, value: string): void {
    this.notify(
      'new_record',
      '🏆 New Record!',
      `${recordType}: ${value}`,
      {
        type: 'new_record',
        priority: 'medium',
        requireInteraction: false,
      }
    );
  }

  notifyPeacefulDay(): void {
    this.notify(
      'peaceful_day',
      '🕊️ Peaceful Day!',
      'No debates today. Harmony achieved!',
      {
        type: 'peaceful_day',
        priority: 'low',
      }
    );
  }

  notifyStreak(days: number): void {
    this.notify(
      'streak',
      '🔥 Daily Streak',
      `${days} days in a row with debates`,
      {
        type: 'streak',
        priority: 'low',
      }
    );
  }

  private formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  // Request browser notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    await this.notify(
      'test',
      "You're all set!",
      "You'll receive notifications when debates happen",
      {
        type: 'test',
        priority: 'low',
      }
    );
  }
}
