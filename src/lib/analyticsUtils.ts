import { DebateSession } from '@/types/debate';
import { calculateTotalOverlapTime, groupSessionsByDate, calculateSessionStats } from './sessionUtils';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';
import { WeeklyStats, MonthlyStats, AnalyticsStats, DailyBreakdown } from './api';

const STORAGE_KEY = 'debate-sessions';

export const loadSessionsFromStorage = (): DebateSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined,
      }));
    }
  } catch (e) {
    console.error('Failed to load sessions from storage:', e);
  }
  return [];
};

export const calculateWeeklyStatsFromSessions = (
  sessions: DebateSession[],
  weekStart: Date,
  weekEnd: Date
): WeeklyStats => {
  const weekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    return sessionDate >= weekStart && sessionDate <= weekEnd && s.duration;
  });

  const husbandSessions = weekSessions.filter(s => s.partner === 'husband');
  const wifeSessions = weekSessions.filter(s => s.partner === 'wife');

  const husbandStats = calculateSessionStats(husbandSessions);
  const wifeStats = calculateSessionStats(wifeSessions);

  const overlapTime = calculateTotalOverlapTime(husbandSessions, wifeSessions);
  const overlapSessions = husbandSessions.filter(h => 
    wifeSessions.some(w => {
      if (!h.endTime || !w.endTime) return false;
      const hStart = h.startTime.getTime();
      const hEnd = h.endTime.getTime();
      const wStart = w.startTime.getTime();
      const wEnd = w.endTime.getTime();
      return Math.max(hStart, wStart) < Math.min(hEnd, wEnd);
    })
  ).length;

  const dailyStats = groupSessionsByDate(weekSessions);
  const heatmapData = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const stats = dailyStats.get(dayKey);
    return {
      date: dayKey,
      intensity: stats ? (stats.husbandTime + stats.wifeTime) / 3600 : 0,
      husband_time: stats?.husbandTime || 0,
      wife_time: stats?.wifeTime || 0,
      overlap_time: stats?.overlapTime || 0,
    };
  });

  // Find peak day
  let peakDay: string | undefined;
  let maxIntensity = 0;
  heatmapData.forEach(day => {
    if (day.intensity > maxIntensity) {
      maxIntensity = day.intensity;
      peakDay = day.date;
    }
  });

  return {
    week_start: format(weekStart, 'yyyy-MM-dd'),
    week_end: format(weekEnd, 'yyyy-MM-dd'),
    husband: {
      total_sessions: husbandStats.totalSessions,
      total_time: husbandStats.totalTime,
      average_duration: husbandStats.averageTime,
      longest_session: husbandStats.longestSession,
      shortest_session: husbandStats.shortestSession,
    },
    wife: {
      total_sessions: wifeStats.totalSessions,
      total_time: wifeStats.totalTime,
      average_duration: wifeStats.averageTime,
      longest_session: wifeStats.longestSession,
      shortest_session: wifeStats.shortestSession,
    },
    overlap: {
      total_overlap_time: overlapTime,
      overlap_sessions: overlapSessions,
      average_overlap_duration: overlapSessions > 0 ? overlapTime / overlapSessions : 0,
      longest_overlap: 0, // Would need to calculate individual overlaps
    },
    peak_day: peakDay,
    peak_time: undefined,
    heatmap_data: heatmapData,
  };
};

export const calculateMonthlyStatsFromSessions = (
  sessions: DebateSession[],
  year: number,
  month: number
): MonthlyStats => {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(new Date(year, month - 1, 1));

  const monthSessions = sessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    return sessionDate >= start && sessionDate <= end && s.duration;
  });

  const husbandSessions = monthSessions.filter(s => s.partner === 'husband');
  const wifeSessions = monthSessions.filter(s => s.partner === 'wife');

  const husbandStats = calculateSessionStats(husbandSessions);
  const wifeStats = calculateSessionStats(wifeSessions);

  const overlapTime = calculateTotalOverlapTime(husbandSessions, wifeSessions);
  const overlapSessions = husbandSessions.filter(h => 
    wifeSessions.some(w => {
      if (!h.endTime || !w.endTime) return false;
      const hStart = h.startTime.getTime();
      const hEnd = h.endTime.getTime();
      const wStart = w.startTime.getTime();
      const wEnd = w.endTime.getTime();
      return Math.max(hStart, wStart) < Math.min(hEnd, wEnd);
    })
  ).length;

  const dailyStats = groupSessionsByDate(monthSessions);
  const trendData = eachDayOfInterval({ start, end }).map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const stats = dailyStats.get(dayKey);
    return {
      date: dayKey,
      husband_time: stats?.husbandTime || 0,
      wife_time: stats?.wifeTime || 0,
      overlap_time: stats?.overlapTime || 0,
    };
  });

  const calendarHeatmap = eachDayOfInterval({ start, end }).map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const stats = dailyStats.get(dayKey);
    return {
      date: dayKey,
      day: day.getDate(),
      intensity: stats ? (stats.husbandTime + stats.wifeTime) / 3600 : 0,
      husband_sessions: stats?.husbandSessions || 0,
      wife_sessions: stats?.wifeSessions || 0,
    };
  });

  // Determine winner
  let winner: 'husband' | 'wife' | undefined;
  let winnerReason: string | undefined;
  if (husbandStats.totalTime < wifeStats.totalTime) {
    winner = 'husband';
    winnerReason = 'least_total_time';
  } else if (wifeStats.totalTime < husbandStats.totalTime) {
    winner = 'wife';
    winnerReason = 'least_total_time';
  } else if (husbandStats.totalSessions < wifeStats.totalSessions) {
    winner = 'husband';
    winnerReason = 'fewest_sessions';
  } else if (wifeStats.totalSessions < husbandStats.totalSessions) {
    winner = 'wife';
    winnerReason = 'fewest_sessions';
  }

  return {
    year,
    month,
    husband: {
      total_sessions: husbandStats.totalSessions,
      total_time: husbandStats.totalTime,
      average_duration: husbandStats.averageTime,
      longest_session: husbandStats.longestSession,
      shortest_session: husbandStats.shortestSession,
    },
    wife: {
      total_sessions: wifeStats.totalSessions,
      total_time: wifeStats.totalTime,
      average_duration: wifeStats.averageTime,
      longest_session: wifeStats.longestSession,
      shortest_session: wifeStats.shortestSession,
    },
    overlap: {
      total_overlap_time: overlapTime,
      overlap_sessions: overlapSessions,
      average_overlap_duration: overlapSessions > 0 ? overlapTime / overlapSessions : 0,
      longest_overlap: 0,
    },
    trend_data: trendData,
    winner,
    winner_reason: winnerReason,
    peacekeeping_winner: undefined, // Would need more complex calculation
    calendar_heatmap: calendarHeatmap,
  };
};

export const calculateGeneralStatsFromSessions = (
  sessions: DebateSession[]
): AnalyticsStats => {
  const completedSessions = sessions.filter(s => s.duration);
  const husbandSessions = completedSessions.filter(s => s.partner === 'husband');
  const wifeSessions = completedSessions.filter(s => s.partner === 'wife');

  const longestHusband = Math.max(...husbandSessions.map(s => s.duration || 0), 0);
  const longestWife = Math.max(...wifeSessions.map(s => s.duration || 0), 0);

  let simultaneousCount = 0;
  let longestSimultaneous = 0;

  for (const h of husbandSessions) {
    if (!h.endTime) continue;
    for (const w of wifeSessions) {
      if (!w.endTime) continue;
      const hStart = h.startTime.getTime();
      const hEnd = h.endTime.getTime();
      const wStart = w.startTime.getTime();
      const wEnd = w.endTime.getTime();
      const overlapStart = Math.max(hStart, wStart);
      const overlapEnd = Math.min(hEnd, wEnd);
      if (overlapStart < overlapEnd) {
        simultaneousCount++;
        const overlapDuration = Math.floor((overlapEnd - overlapStart) / 1000);
        longestSimultaneous = Math.max(longestSimultaneous, overlapDuration);
      }
    }
  }

  const dailyStats = groupSessionsByDate(completedSessions);
  let mostActiveDay: string | undefined;
  let leastActiveDay: string | undefined;
  let maxActivity = 0;
  let minActivity = Infinity;

  dailyStats.forEach((stats, dayKey) => {
    if (stats.totalTime > maxActivity) {
      maxActivity = stats.totalTime;
      mostActiveDay = dayKey;
    }
    if (stats.totalTime < minActivity) {
      minActivity = stats.totalTime;
      leastActiveDay = dayKey;
    }
  });

  const totalTime = completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const overlapTime = calculateTotalOverlapTime(husbandSessions, wifeSessions);
  const overlapPercentage = totalTime > 0 ? (overlapTime / totalTime) * 100 : 0;

  const allDates = new Set(completedSessions.map(s => format(new Date(s.startTime), 'yyyy-MM-dd')));
  const peacefulDays = 0; // Would need date range to calculate

  const sortedDates = Array.from(allDates).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  if (sortedDates.length > 0) {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (sortedDates.includes(today)) {
      currentStreak = 1;
      for (let i = sortedDates.length - 1; i > 0; i--) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        if (Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)) === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const daysDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  const frequencyPattern: Record<string, number> = {};
  completedSessions.forEach(s => {
    const dayName = format(new Date(s.startTime), 'EEEE');
    frequencyPattern[dayName] = (frequencyPattern[dayName] || 0) + 1;
  });

  return {
    total_debates: completedSessions.length,
    total_simultaneous: simultaneousCount,
    longest_debate_husband: longestHusband,
    longest_debate_wife: longestWife,
    longest_simultaneous: longestSimultaneous,
    most_active_day: mostActiveDay,
    least_active_day: leastActiveDay,
    debate_frequency_pattern: frequencyPattern,
    overlap_percentage: overlapPercentage,
    peaceful_days_count: peacefulDays,
    current_streak: currentStreak,
    longest_streak: longestStreak,
  };
};

export const calculateDailyBreakdownFromSessions = (
  sessions: DebateSession[],
  targetDate: Date
): DailyBreakdown => {
  const dateStr = format(targetDate, 'yyyy-MM-dd');
  const daySessions = sessions.filter(s => {
    const sessionDate = format(new Date(s.startTime), 'yyyy-MM-dd');
    return sessionDate === dateStr;
  });

  const husbandSessions = daySessions.filter(s => s.partner === 'husband');
  const wifeSessions = daySessions.filter(s => s.partner === 'wife');

  const husbandTime = husbandSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const wifeTime = wifeSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const overlapTime = calculateTotalOverlapTime(husbandSessions, wifeSessions);

  return {
    date: dateStr,
    husband_sessions: husbandSessions.length,
    wife_sessions: wifeSessions.length,
    husband_time: husbandTime,
    wife_time: wifeTime,
    overlap_time: overlapTime,
    sessions: daySessions.map(s => ({
      id: parseInt(s.id) || 0,
      partner: s.partner,
      start_time: s.startTime.toISOString(),
      end_time: s.endTime?.toISOString(),
      duration: s.duration,
      created_at: s.startTime.toISOString(),
      updated_at: s.endTime?.toISOString() || s.startTime.toISOString(),
    })),
  };
};

