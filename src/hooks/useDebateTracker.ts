import { useState, useEffect, useCallback, useRef } from 'react';
import { Partner, DebateSession } from '@/types/debate';
import { subDays, subHours, subMinutes } from 'date-fns';
import { apiClient, wsClient, SessionResponse } from '@/lib/api';
import { getPartnerName } from '@/lib/partnerSettings';
import { useDemoMode } from './useDemoMode';
import { generateFakeLastMonthSessions } from '@/lib/fakeDataGenerator';

const STORAGE_KEY = 'debate-sessions';

const generateId = () => Math.random().toString(36).substring(2, 9);

// Convert API session to app session format
const apiToAppSession = (apiSession: SessionResponse): DebateSession => ({
  id: apiSession.id.toString(),
  partner: apiSession.partner,
  startTime: new Date(apiSession.start_time),
  endTime: apiSession.end_time ? new Date(apiSession.end_time) : undefined,
  duration: apiSession.duration || undefined,
});

// Convert app session to API format
const appToApiSession = (session: Partial<DebateSession>) => ({
  partner: session.partner!,
  start_time: session.startTime!.toISOString(),
  end_time: session.endTime?.toISOString(),
  duration: session.duration,
});

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
  const { isDemoMode } = useDemoMode();
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

  // Reset active timers when switching to demo mode
  useEffect(() => {
    if (isDemoMode) {
      // Stop all active timers when entering demo mode
      setHusbandActive(false);
      setWifeActive(false);
      setHusbandTime(0);
      setWifeTime(0);
      if (husbandIntervalRef.current) {
        clearInterval(husbandIntervalRef.current);
      }
      if (wifeIntervalRef.current) {
        clearInterval(wifeIntervalRef.current);
      }
      husbandStartRef.current = null;
      wifeStartRef.current = null;
      setLastHusbandSession(null);
      setLastWifeSession(null);
    }
  }, [isDemoMode]);

  // Load sessions from API or localStorage, or use demo data
  useEffect(() => {
    const loadSessions = async () => {
      if (isDemoMode) {
        // Use fake sessions for demo mode (local only, no backend)
        const fakeSessions = generateFakeLastMonthSessions();
        setSessions(fakeSessions);
        // Also save to localStorage with a demo marker
        localStorage.setItem(STORAGE_KEY + '_demo', JSON.stringify(fakeSessions));
        return;
      }

      // REAL USER MODE: Always use Supabase backend (shared database for both partners)
      // Reset demo data if switching from demo mode
      localStorage.removeItem(STORAGE_KEY + '_demo');

      // For real users, always use the backend API (Supabase)
      // This ensures both husband and wife see the same shared data
      try {
        const apiSessions = await apiClient.getSessions();
        const appSessions = apiSessions.map(apiToAppSession);
        setSessions(appSessions);
        // Also save to localStorage as backup (but backend is primary)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appSessions));
      } catch (error) {
        console.error('Failed to load sessions from Supabase API:', error);
        console.error('Make sure the backend is running with main_supabase.py and Supabase is configured');
        // Try to load from localStorage as a last resort, but warn the user
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setSessions(parsed.map((s: any) => ({
              ...s,
              startTime: new Date(s.startTime),
              endTime: s.endTime ? new Date(s.endTime) : undefined,
            })));
            console.warn('Using cached localStorage data. Backend connection failed.');
          } catch (e) {
            console.error('Failed to parse sessions:', e);
            setSessions([]);
          }
        } else {
          // No stored sessions - reset to empty
          setSessions([]);
        }
      }
    };

    loadSessions();

    // Set up WebSocket listener for real-time updates (only in real user mode)
    if (!isDemoMode) {
      // Connect to WebSocket for real-time sync between devices
      wsClient.connect();
      const handleSessionUpdate = (data: any) => {
        loadSessions(); // Reload sessions when updated (sync across devices)
      };
      wsClient.on('session_created', handleSessionUpdate);
      wsClient.on('session_updated', handleSessionUpdate);
      wsClient.on('session_deleted', handleSessionUpdate);
      wsClient.on('notification', handleSessionUpdate);

      return () => {
        wsClient.off('session_created', handleSessionUpdate);
        wsClient.off('session_updated', handleSessionUpdate);
        wsClient.off('session_deleted', handleSessionUpdate);
        wsClient.off('notification', handleSessionUpdate);
        wsClient.disconnect();
      };
    }
  }, [isDemoMode]);

  // Save sessions to localStorage as backup (only for real user mode)
  useEffect(() => {
    if (!isDemoMode && sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isDemoMode]);

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

  const toggleHusband = useCallback(async () => {
    // Don't allow toggling in demo mode
    if (isDemoMode) {
      return { action: 'start' as const, partner: 'husband' as Partner };
    }

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
      
      // REAL USER MODE: Save to Supabase (shared database for both partners)
      try {
        const apiSession = await apiClient.createSession(appToApiSession(session));
        const savedSession = apiToAppSession(apiSession);
        setSessions(prev => [...prev, savedSession]);
        setLastHusbandSession(savedSession);
        
        // Send notification (will be broadcast to all connected devices via WebSocket)
        try {
          await apiClient.createNotification({
            type: 'debate_end',
            title: `${getPartnerName('husband')} Ended Debate`,
            message: `Duration: ${Math.floor(husbandTime / 60)}:${String(husbandTime % 60).padStart(2, '0')}`,
            partner: 'husband',
            data: { duration: husbandTime },
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      } catch (error) {
        console.error('Failed to save session to Supabase:', error);
        console.error('Make sure the backend is running with main_supabase.py');
        // Still update local state for immediate feedback, but warn user
        setSessions(prev => [...prev, session]);
        setLastHusbandSession(session);
        alert('Warning: Could not save to database. Data may not sync across devices.');
      }
      
      setHusbandActive(false);
      setHusbandTime(0);
      husbandStartRef.current = null;
      return { action: 'end' as const, partner: 'husband' as Partner, duration: husbandTime };
    }
  }, [husbandActive, husbandTime, isDemoMode]);

  const toggleWife = useCallback(async () => {
    // Don't allow toggling in demo mode
    if (isDemoMode) {
      return { action: 'start' as const, partner: 'wife' as Partner };
    }

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
      
      // REAL USER MODE: Save to Supabase (shared database for both partners)
      try {
        const apiSession = await apiClient.createSession(appToApiSession(session));
        const savedSession = apiToAppSession(apiSession);
        setSessions(prev => [...prev, savedSession]);
        setLastWifeSession(savedSession);
        
        // Send notification (will be broadcast to all connected devices via WebSocket)
        try {
          await apiClient.createNotification({
            type: 'debate_end',
            title: `${getPartnerName('wife')} Ended Debate`,
            message: `Duration: ${Math.floor(wifeTime / 60)}:${String(wifeTime % 60).padStart(2, '0')}`,
            partner: 'wife',
            data: { duration: wifeTime },
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      } catch (error) {
        console.error('Failed to save session to Supabase:', error);
        console.error('Make sure the backend is running with main_supabase.py');
        // Still update local state for immediate feedback, but warn user
        setSessions(prev => [...prev, session]);
        setLastWifeSession(session);
        alert('Warning: Could not save to database. Data may not sync across devices.');
      }
      
      setWifeActive(false);
      setWifeTime(0);
      wifeStartRef.current = null;
      return { action: 'end' as const, partner: 'wife' as Partner, duration: wifeTime };
    }
  }, [wifeActive, wifeTime, isDemoMode]);

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
