import { useState, useEffect, useCallback, useRef } from 'react';
import { Partner, DebateSession } from '@/types/debate';
import { subDays, subHours, subMinutes } from 'date-fns';

const STORAGE_KEY = 'debate-sessions';

const generateId = () => Math.random().toString(36).substring(2, 9);

// Generate sample data for demo purposes
const generateSampleData = (): DebateSession[] => {
  const now = new Date();
  const samples: DebateSession[] = [];
  
  // Generate some sample sessions over the past 30 days
  const sessionData = [
    { daysAgo: 1, hoursAgo: 2, partner: 'husband' as Partner, duration: 312 },
    { daysAgo: 1, hoursAgo: 5, partner: 'wife' as Partner, duration: 187 },
    { daysAgo: 2, hoursAgo: 3, partner: 'husband' as Partner, duration: 425 },
    { daysAgo: 2, hoursAgo: 6, partner: 'wife' as Partner, duration: 298 },
    { daysAgo: 2, hoursAgo: 8, partner: 'husband' as Partner, duration: 156 },
    { daysAgo: 3, hoursAgo: 4, partner: 'wife' as Partner, duration: 512 },
    { daysAgo: 5, hoursAgo: 2, partner: 'husband' as Partner, duration: 234 },
    { daysAgo: 5, hoursAgo: 3, partner: 'wife' as Partner, duration: 189 },
    { daysAgo: 5, hoursAgo: 5, partner: 'husband' as Partner, duration: 445 },
    { daysAgo: 5, hoursAgo: 7, partner: 'wife' as Partner, duration: 312 },
    { daysAgo: 7, hoursAgo: 1, partner: 'wife' as Partner, duration: 623 },
    { daysAgo: 10, hoursAgo: 4, partner: 'husband' as Partner, duration: 178 },
    { daysAgo: 12, hoursAgo: 2, partner: 'wife' as Partner, duration: 267 },
    { daysAgo: 12, hoursAgo: 5, partner: 'husband' as Partner, duration: 398 },
    { daysAgo: 15, hoursAgo: 3, partner: 'wife' as Partner, duration: 145 },
  ];

  sessionData.forEach(({ daysAgo, hoursAgo, partner, duration }) => {
    const startTime = subMinutes(subHours(subDays(now, daysAgo), hoursAgo), duration / 60);
    const endTime = subHours(subDays(now, daysAgo), hoursAgo);
    
    samples.push({
      id: generateId(),
      partner,
      startTime,
      endTime,
      duration,
    });
  });

  return samples;
};

export const useDebateTracker = () => {
  const [husbandActive, setHusbandActive] = useState(false);
  const [wifeActive, setWifeActive] = useState(false);
  const [husbandTime, setHusbandTime] = useState(0);
  const [wifeTime, setWifeTime] = useState(0);
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [lastHusbandSession, setLastHusbandSession] = useState<DebateSession | null>(null);
  const [lastWifeSession, setLastWifeSession] = useState<DebateSession | null>(null);

  const husbandStartRef = useRef<Date | null>(null);
  const wifeStartRef = useRef<Date | null>(null);
  const husbandIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wifeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
        })));
      } catch (e) {
        console.error('Failed to parse sessions:', e);
        // Load sample data if parsing fails
        const sampleData = generateSampleData();
        setSessions(sampleData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
      }
    } else {
      // No stored data, load sample data for demo
      const sampleData = generateSampleData();
      setSessions(sampleData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Husband timer
  useEffect(() => {
    if (husbandActive) {
      husbandStartRef.current = new Date();
      husbandIntervalRef.current = setInterval(() => {
        if (husbandStartRef.current) {
          const elapsed = Math.floor((Date.now() - husbandStartRef.current.getTime()) / 1000);
          setHusbandTime(elapsed);
        }
      }, 1000);
    } else {
      if (husbandIntervalRef.current) {
        clearInterval(husbandIntervalRef.current);
      }
    }

    return () => {
      if (husbandIntervalRef.current) {
        clearInterval(husbandIntervalRef.current);
      }
    };
  }, [husbandActive]);

  // Wife timer
  useEffect(() => {
    if (wifeActive) {
      wifeStartRef.current = new Date();
      wifeIntervalRef.current = setInterval(() => {
        if (wifeStartRef.current) {
          const elapsed = Math.floor((Date.now() - wifeStartRef.current.getTime()) / 1000);
          setWifeTime(elapsed);
        }
      }, 1000);
    } else {
      if (wifeIntervalRef.current) {
        clearInterval(wifeIntervalRef.current);
      }
    }

    return () => {
      if (wifeIntervalRef.current) {
        clearInterval(wifeIntervalRef.current);
      }
    };
  }, [wifeActive]);

  const toggleHusband = useCallback(() => {
    if (!husbandActive) {
      // Starting
      setHusbandActive(true);
      setHusbandTime(0);
      return { action: 'start' as const, partner: 'husband' as Partner };
    } else {
      // Stopping
      const endTime = new Date();
      const session: DebateSession = {
        id: generateId(),
        partner: 'husband',
        startTime: husbandStartRef.current!,
        endTime,
        duration: husbandTime,
      };
      setSessions(prev => [...prev, session]);
      setLastHusbandSession(session);
      setHusbandActive(false);
      setHusbandTime(0);
      husbandStartRef.current = null;
      return { action: 'end' as const, partner: 'husband' as Partner, duration: husbandTime };
    }
  }, [husbandActive, husbandTime]);

  const toggleWife = useCallback(() => {
    if (!wifeActive) {
      // Starting
      setWifeActive(true);
      setWifeTime(0);
      return { action: 'start' as const, partner: 'wife' as Partner };
    } else {
      // Stopping
      const endTime = new Date();
      const session: DebateSession = {
        id: generateId(),
        partner: 'wife',
        startTime: wifeStartRef.current!,
        endTime,
        duration: wifeTime,
      };
      setSessions(prev => [...prev, session]);
      setLastWifeSession(session);
      setWifeActive(false);
      setWifeTime(0);
      wifeStartRef.current = null;
      return { action: 'end' as const, partner: 'wife' as Partner, duration: wifeTime };
    }
  }, [wifeActive, wifeTime]);

  const getTodayStats = useCallback(() => {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      s => new Date(s.startTime).toDateString() === today && s.duration
    );

    const husbandSessions = todaySessions.filter(s => s.partner === 'husband');
    const wifeSessions = todaySessions.filter(s => s.partner === 'wife');

    return {
      husbandCount: husbandSessions.length,
      wifeCount: wifeSessions.length,
      husbandTotalTime: husbandSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      wifeTotalTime: wifeSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      totalSessions: todaySessions.length,
    };
  }, [sessions]);

  return {
    husbandActive,
    wifeActive,
    husbandTime,
    wifeTime,
    bothActive: husbandActive && wifeActive,
    toggleHusband,
    toggleWife,
    sessions,
    lastHusbandSession,
    lastWifeSession,
    getTodayStats,
  };
};
