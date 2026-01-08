export type Partner = 'husband' | 'wife';

export interface DebateSession {
  id: string;
  partner: Partner;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
}

export interface DailyStats {
  date: string;
  husbandSessions: number;
  wifeSessions: number;
  husbandTotalTime: number;
  wifeTotal: number;
  overlapTime: number;
}

export interface NotificationSettings {
  inAppEnabled: boolean;
  browserEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  timeMilestones: number[];
  dailySummary: { enabled: boolean; time: string };
  weeklySummary: { enabled: boolean; day: number; time: string };
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  timestamp: number;
}
