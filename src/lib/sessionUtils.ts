import { DebateSession } from '@/types/debate';

/**
 * Calculate overlap time between two sessions
 */
export const calculateSessionOverlap = (
  session1: DebateSession,
  session2: DebateSession
): number => {
  // Both sessions must have start and end times
  if (!session1.endTime || !session2.endTime) {
    return 0;
  }

  const start1 = new Date(session1.startTime).getTime();
  const end1 = new Date(session1.endTime).getTime();
  const start2 = new Date(session2.startTime).getTime();
  const end2 = new Date(session2.endTime).getTime();

  // Find the overlap period
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  // If there's no overlap, return 0
  if (overlapStart >= overlapEnd) {
    return 0;
  }

  // Return overlap duration in seconds
  return Math.floor((overlapEnd - overlapStart) / 1000);
};

/**
 * Calculate total overlap time for all sessions in a given list
 * Finds overlaps between husband and wife sessions
 */
export const calculateTotalOverlapTime = (
  husbandSessions: DebateSession[],
  wifeSessions: DebateSession[]
): number => {
  let totalOverlap = 0;

  // Check each husband session against each wife session
  for (const husbandSession of husbandSessions) {
    if (!husbandSession.endTime) continue;

    for (const wifeSession of wifeSessions) {
      if (!wifeSession.endTime) continue;

      const overlap = calculateSessionOverlap(husbandSession, wifeSession);
      totalOverlap += overlap;
    }
  }

  return totalOverlap;
};

/**
 * Get detailed overlap information for visualization
 */
export interface OverlapPeriod {
  start: Date;
  end: Date;
  duration: number; // in seconds
  husbandSessionId: string;
  wifeSessionId: string;
}

export const getOverlapPeriods = (
  husbandSessions: DebateSession[],
  wifeSessions: DebateSession[]
): OverlapPeriod[] => {
  const overlaps: OverlapPeriod[] = [];

  for (const husbandSession of husbandSessions) {
    if (!husbandSession.endTime) continue;

    for (const wifeSession of wifeSessions) {
      if (!wifeSession.endTime) continue;

      const start1 = new Date(husbandSession.startTime);
      const end1 = new Date(husbandSession.endTime);
      const start2 = new Date(wifeSession.startTime);
      const end2 = new Date(wifeSession.endTime);

      const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
      const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

      if (overlapStart < overlapEnd) {
        overlaps.push({
          start: overlapStart,
          end: overlapEnd,
          duration: Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 1000),
          husbandSessionId: husbandSession.id,
          wifeSessionId: wifeSession.id,
        });
      }
    }
  }

  return overlaps.sort((a, b) => a.start.getTime() - b.start.getTime());
};

/**
 * Calculate statistics for a set of sessions
 */
export interface SessionStats {
  totalSessions: number;
  totalTime: number; // in seconds
  averageTime: number; // in seconds
  longestSession: number; // in seconds
  shortestSession: number; // in seconds
}

export const calculateSessionStats = (sessions: DebateSession[]): SessionStats => {
  const completedSessions = sessions.filter(s => s.duration);

  if (completedSessions.length === 0) {
    return {
      totalSessions: 0,
      totalTime: 0,
      averageTime: 0,
      longestSession: 0,
      shortestSession: 0,
    };
  }

  const durations = completedSessions.map(s => s.duration || 0);
  const totalTime = durations.reduce((acc, d) => acc + d, 0);

  return {
    totalSessions: completedSessions.length,
    totalTime,
    averageTime: Math.floor(totalTime / completedSessions.length),
    longestSession: Math.max(...durations),
    shortestSession: Math.min(...durations),
  };
};

/**
 * Get daily statistics from sessions
 */
export interface DailySessionStats {
  date: string; // yyyy-MM-dd format
  husbandSessions: number;
  wifeSessions: number;
  totalSessions: number;
  husbandTime: number;
  wifeTime: number;
  totalTime: number;
  overlapTime: number;
}

export const groupSessionsByDate = (sessions: DebateSession[]): Map<string, DailySessionStats> => {
  const statsMap = new Map<string, DailySessionStats>();

  sessions.forEach(session => {
    const dateKey = session.startTime.toISOString().split('T')[0];

    if (!statsMap.has(dateKey)) {
      statsMap.set(dateKey, {
        date: dateKey,
        husbandSessions: 0,
        wifeSessions: 0,
        totalSessions: 0,
        husbandTime: 0,
        wifeTime: 0,
        totalTime: 0,
        overlapTime: 0,
      });
    }

    const stats = statsMap.get(dateKey)!;
    stats.totalSessions++;

    if (session.partner === 'husband') {
      stats.husbandSessions++;
      stats.husbandTime += session.duration || 0;
    } else {
      stats.wifeSessions++;
      stats.wifeTime += session.duration || 0;
    }

    stats.totalTime += session.duration || 0;
  });

  // Calculate overlaps for each date
  statsMap.forEach((stats, dateKey) => {
    const dateSessions = sessions.filter(
      s => s.startTime.toISOString().split('T')[0] === dateKey
    );

    const husbandSessions = dateSessions.filter(s => s.partner === 'husband');
    const wifeSessions = dateSessions.filter(s => s.partner === 'wife');

    stats.overlapTime = calculateTotalOverlapTime(husbandSessions, wifeSessions);
  });

  return statsMap;
};
