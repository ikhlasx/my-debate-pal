import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, addHours, addMinutes } from 'date-fns';
import { DebateSession } from '@/types/debate';
import { WeeklyStats, MonthlyStats, AnalyticsStats, HeatmapData, TrendData, CalendarHeatmapData } from './api';

// Seed for consistent random generation
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Generate fake sessions for last month
export const generateFakeLastMonthSessions = (): DebateSession[] => {
  const lastMonth = subMonths(new Date(), 1);
  const start = startOfMonth(lastMonth);
  const end = endOfMonth(lastMonth);
  const days = eachDayOfInterval({ start, end });
  
  const sessions: DebateSession[] = [];
  let sessionId = 10000;
  
  days.forEach((day, dayIndex) => {
    const seed = dayIndex * 100;
    const dayOfWeek = day.getDay();
    
    // More debates on weekends
    const baseSessionCount = dayOfWeek === 0 || dayOfWeek === 6 ? 4 : 2;
    const husbandSessionCount = Math.floor(seededRandom(seed) * baseSessionCount) + 1;
    const wifeSessionCount = Math.floor(seededRandom(seed + 1) * baseSessionCount) + 1;
    
    // Generate husband sessions
    for (let i = 0; i < husbandSessionCount; i++) {
      const hour = Math.floor(seededRandom(seed + i * 10) * 14) + 8; // 8am - 10pm
      const minute = Math.floor(seededRandom(seed + i * 11) * 60);
      const duration = Math.floor(seededRandom(seed + i * 12) * 1800) + 180; // 3-33 minutes
      
      const startTime = addMinutes(addHours(day, hour), minute);
      const endTime = addMinutes(startTime, Math.floor(duration / 60));
      
      sessions.push({
        id: `fake-${sessionId++}`,
        partner: 'husband',
        startTime,
        endTime,
        duration,
      });
    }
    
    // Generate wife sessions
    for (let i = 0; i < wifeSessionCount; i++) {
      const hour = Math.floor(seededRandom(seed + 50 + i * 10) * 14) + 8;
      const minute = Math.floor(seededRandom(seed + 50 + i * 11) * 60);
      const duration = Math.floor(seededRandom(seed + 50 + i * 12) * 1500) + 120; // 2-27 minutes
      
      const startTime = addMinutes(addHours(day, hour), minute);
      const endTime = addMinutes(startTime, Math.floor(duration / 60));
      
      sessions.push({
        id: `fake-${sessionId++}`,
        partner: 'wife',
        startTime,
        endTime,
        duration,
      });
    }
  });
  
  return sessions;
};

// Generate fake monthly stats for a specific month (defaults to last month)
export const generateFakeMonthlyStats = (targetMonth?: Date): MonthlyStats => {
  const monthDate = targetMonth || subMonths(new Date(), 1);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  
  // Only include days up to today if it's the current month
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const filteredDays = isCurrentMonth 
    ? days.filter(day => day <= today)
    : days;
  
  // Generate trend data
  const trendData: TrendData[] = filteredDays.map((day, index) => {
    const seed = index * 100;
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const husbandTime = Math.floor(seededRandom(seed) * (isWeekend ? 3600 : 1800)) + 300;
    const wifeTime = Math.floor(seededRandom(seed + 1) * (isWeekend ? 3000 : 1500)) + 200;
    const overlapTime = Math.floor(seededRandom(seed + 2) * Math.min(husbandTime, wifeTime) * 0.3);
    
    return {
      date: format(day, 'yyyy-MM-dd'),
      husband_time: husbandTime,
      wife_time: wifeTime,
      overlap_time: overlapTime,
    };
  });
  
  // Generate calendar heatmap (for all days in the month, but only generate data for filtered days)
  const calendarHeatmap: CalendarHeatmapData[] = days.map((day, index) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const trendItem = trendData.find(t => t.date === dayStr);
    
    if (trendItem) {
      return {
        date: dayStr,
        day: day.getDate(),
        intensity: (trendItem.husband_time + trendItem.wife_time) / 3600,
        husband_sessions: Math.floor(seededRandom(index * 200) * 4) + 1,
        wife_sessions: Math.floor(seededRandom(index * 201) * 4) + 1,
      };
    } else {
      // For future dates in current month or days without data
      return {
        date: dayStr,
        day: day.getDate(),
        intensity: 0,
        husband_sessions: 0,
        wife_sessions: 0,
      };
    }
  });
  
  const totalHusbandTime = trendData.reduce((acc, d) => acc + d.husband_time, 0);
  const totalWifeTime = trendData.reduce((acc, d) => acc + d.wife_time, 0);
  const totalOverlapTime = trendData.reduce((acc, d) => acc + d.overlap_time, 0);
  const husbandSessions = calendarHeatmap.reduce((acc, d) => acc + d.husband_sessions, 0);
  const wifeSessions = calendarHeatmap.reduce((acc, d) => acc + d.wife_sessions, 0);
  
  return {
    year,
    month,
    husband: {
      total_sessions: husbandSessions,
      total_time: totalHusbandTime,
      average_duration: Math.floor(totalHusbandTime / husbandSessions),
      longest_session: 2847,
      shortest_session: 124,
    },
    wife: {
      total_sessions: wifeSessions,
      total_time: totalWifeTime,
      average_duration: Math.floor(totalWifeTime / wifeSessions),
      longest_session: 2156,
      shortest_session: 98,
    },
    overlap: {
      total_overlap_time: totalOverlapTime,
      overlap_sessions: Math.floor(Math.min(husbandSessions, wifeSessions) * 0.2),
      average_overlap_duration: 420,
      longest_overlap: 1245,
    },
    trend_data: trendData,
    winner: totalHusbandTime < totalWifeTime ? 'husband' : 'wife',
    winner_reason: 'least_total_time',
    peacekeeping_winner: totalWifeTime < totalHusbandTime ? 'wife' : 'husband',
    calendar_heatmap: calendarHeatmap,
  };
};

// Generate fake monthly stats for last month (backward compatibility)
export const generateFakeLastMonthStats = (): MonthlyStats => {
  return generateFakeMonthlyStats();
};

// Generate fake weekly stats for comparison
export const generateFakeLastWeekStats = (): WeeklyStats => {
  const today = new Date();
  const weekStart = subDays(today, 13); // Two weeks ago
  const weekEnd = subDays(today, 7);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const heatmapData: HeatmapData[] = days.map((day, index) => {
    const seed = index * 50;
    const husbandTime = Math.floor(seededRandom(seed) * 2400) + 300;
    const wifeTime = Math.floor(seededRandom(seed + 1) * 2000) + 200;
    const overlapTime = Math.floor(seededRandom(seed + 2) * 600);
    
    return {
      date: format(day, 'yyyy-MM-dd'),
      intensity: (husbandTime + wifeTime) / 3600,
      husband_time: husbandTime,
      wife_time: wifeTime,
      overlap_time: overlapTime,
    };
  });
  
  const totalHusbandTime = heatmapData.reduce((acc, d) => acc + d.husband_time, 0);
  const totalWifeTime = heatmapData.reduce((acc, d) => acc + d.wife_time, 0);
  const totalOverlapTime = heatmapData.reduce((acc, d) => acc + d.overlap_time, 0);
  
  return {
    week_start: format(weekStart, 'yyyy-MM-dd'),
    week_end: format(weekEnd, 'yyyy-MM-dd'),
    husband: {
      total_sessions: 18,
      total_time: totalHusbandTime,
      average_duration: Math.floor(totalHusbandTime / 18),
      longest_session: 1847,
      shortest_session: 187,
    },
    wife: {
      total_sessions: 15,
      total_time: totalWifeTime,
      average_duration: Math.floor(totalWifeTime / 15),
      longest_session: 1456,
      shortest_session: 134,
    },
    overlap: {
      total_overlap_time: totalOverlapTime,
      overlap_sessions: 4,
      average_overlap_duration: Math.floor(totalOverlapTime / 4),
      longest_overlap: 845,
    },
    peak_day: format(days[2], 'yyyy-MM-dd'),
    peak_time: '19:30',
    heatmap_data: heatmapData,
  };
};

// Generate fake general stats
export const generateFakeGeneralStats = (): AnalyticsStats => {
  return {
    total_debates: 156,
    total_simultaneous: 23,
    longest_debate_husband: 3245,
    longest_debate_wife: 2876,
    longest_simultaneous: 1567,
    most_active_day: format(subDays(new Date(), 12), 'yyyy-MM-dd'),
    least_active_day: format(subDays(new Date(), 25), 'yyyy-MM-dd'),
    debate_frequency_pattern: {
      'Monday': 18,
      'Tuesday': 22,
      'Wednesday': 19,
      'Thursday': 24,
      'Friday': 28,
      'Saturday': 31,
      'Sunday': 14,
    },
    overlap_percentage: 14.7,
    peaceful_days_count: 8,
    current_streak: 3,
    longest_streak: 12,
  };
};

// Calculate month-over-month comparison
export interface MonthComparison {
  sessionsChange: number;
  timeChange: number;
  overlapChange: number;
  husbandSessionsChange: number;
  wifeSessionsChange: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export const calculateMonthComparison = (
  currentMonth: MonthlyStats,
  previousMonth: MonthlyStats
): MonthComparison => {
  const currentTotal = currentMonth.husband.total_sessions + currentMonth.wife.total_sessions;
  const previousTotal = previousMonth.husband.total_sessions + previousMonth.wife.total_sessions;
  
  const currentTime = currentMonth.husband.total_time + currentMonth.wife.total_time;
  const previousTime = previousMonth.husband.total_time + previousMonth.wife.total_time;
  
  const sessionsChange = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal) * 100 
    : 0;
  
  const timeChange = previousTime > 0 
    ? ((currentTime - previousTime) / previousTime) * 100 
    : 0;
  
  const overlapChange = previousMonth.overlap.total_overlap_time > 0
    ? ((currentMonth.overlap.total_overlap_time - previousMonth.overlap.total_overlap_time) / previousMonth.overlap.total_overlap_time) * 100
    : 0;
  
  const husbandSessionsChange = previousMonth.husband.total_sessions > 0
    ? ((currentMonth.husband.total_sessions - previousMonth.husband.total_sessions) / previousMonth.husband.total_sessions) * 100
    : 0;
  
  const wifeSessionsChange = previousMonth.wife.total_sessions > 0
    ? ((currentMonth.wife.total_sessions - previousMonth.wife.total_sessions) / previousMonth.wife.total_sessions) * 100
    : 0;
  
  // Negative means fewer debates = improving
  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (sessionsChange < -10 || timeChange < -10) {
    trend = 'improving';
  } else if (sessionsChange > 10 || timeChange > 10) {
    trend = 'worsening';
  }
  
  return {
    sessionsChange,
    timeChange,
    overlapChange,
    husbandSessionsChange,
    wifeSessionsChange,
    trend,
  };
};

