import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDebateTracker } from '@/hooks/useDebateTracker';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Header } from '@/components/Header';
import { DebateToggle } from '@/components/DebateToggle';
import { StatsCard } from '@/components/StatsCard';
import { SessionHistory } from '@/components/SessionHistory';
import { ToastContainer } from '@/components/ToastContainer';
import { BothActiveIndicator } from '@/components/BothActiveIndicator';
import { CalendarView } from '@/components/CalendarView';
import { getPartnerName } from '@/lib/partnerSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const Index = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const { isDemoMode } = useDemoMode();

  const {
    husbandActive,
    wifeActive,
    husbandTime,
    wifeTime,
    bothActive,
    toggleHusband,
    toggleWife,
    sessions,
    lastHusbandSession,
    lastWifeSession,
    getTodayStats,
  } = useDebateTracker();

  const {
    toasts,
    permission,
    requestPermission,
    dismissToast,
    notifyDebateStart,
    notifyDebateEnd,
    notifyBothActive,
    checkMilestones,
  } = useNotifications();

  const { isSubscribed, sendNotification } = usePushNotifications();

  const prevBothActiveRef = useRef(false);

  // Format duration helper
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Send push notification when app is in background
  const sendPushIfBackground = useCallback(async (title: string, body: string, tag: string, data?: Record<string, any>) => {
    if (isSubscribed && document.visibilityState === 'hidden') {
      await sendNotification({
        title,
        body,
        tag,
        icon: '/favicon.ico',
        data: { url: '/', ...data },
        requireInteraction: tag.includes('both_active'),
        vibrate: tag.includes('both_active') ? [200, 100, 200] : [100, 50, 100],
      });
    }
  }, [isSubscribed, sendNotification]);

  // Handle both active notification
  useEffect(() => {
    if (bothActive && !prevBothActiveRef.current) {
      notifyBothActive();
      sendPushIfBackground(
        '⚠️ Both Partners Debating!',
        `${getPartnerName('husband')} and ${getPartnerName('wife')} are both actively debating`,
        'both_active',
        { type: 'both_active' }
      );
    }
    prevBothActiveRef.current = bothActive;
  }, [bothActive, notifyBothActive, sendPushIfBackground]);

  // Check milestones
  useEffect(() => {
    if (husbandActive) {
      checkMilestones('husband', husbandTime);
      
      // Send push for milestones
      const minutes = Math.floor(husbandTime / 60);
      if ([5, 15, 30].includes(minutes) && husbandTime % 60 === 0) {
        const emoji = minutes >= 30 ? '🚨' : '⏰';
        sendPushIfBackground(
          `${emoji} Time Alert`,
          `${getPartnerName('husband')}'s debate: ${minutes} minutes`,
          `milestone_${minutes}_husband`,
          { type: 'milestone', minutes, partner: 'husband' }
        );
      }
    }
  }, [husbandActive, husbandTime, checkMilestones, sendPushIfBackground]);

  useEffect(() => {
    if (wifeActive) {
      checkMilestones('wife', wifeTime);
      
      // Send push for milestones
      const minutes = Math.floor(wifeTime / 60);
      if ([5, 15, 30].includes(minutes) && wifeTime % 60 === 0) {
        const emoji = minutes >= 30 ? '🚨' : '⏰';
        sendPushIfBackground(
          `${emoji} Time Alert`,
          `${getPartnerName('wife')}'s debate: ${minutes} minutes`,
          `milestone_${minutes}_wife`,
          { type: 'milestone', minutes, partner: 'wife' }
        );
      }
    }
  }, [wifeActive, wifeTime, checkMilestones, sendPushIfBackground]);

  const handleHusbandToggle = async () => {
    const result = toggleHusband();
    if (result.action === 'start') {
      notifyDebateStart('husband');
      await sendPushIfBackground(
        '🔴 Debate Started',
        `${getPartnerName('husband')} has started a debate`,
        'debate_start_husband',
        { type: 'debate_start', partner: 'husband' }
      );
    } else if (result.action === 'end' && result.duration !== undefined) {
      notifyDebateEnd('husband', result.duration);
      await sendPushIfBackground(
        '✅ Debate Ended',
        `${getPartnerName('husband')}'s debate ended. Duration: ${formatDuration(result.duration)}`,
        'debate_end_husband',
        { type: 'debate_end', partner: 'husband', duration: result.duration }
      );
    }
  };

  const handleWifeToggle = async () => {
    const result = toggleWife();
    if (result.action === 'start') {
      notifyDebateStart('wife');
      await sendPushIfBackground(
        '🔴 Debate Started',
        `${getPartnerName('wife')} has started a debate`,
        'debate_start_wife',
        { type: 'debate_start', partner: 'wife' }
      );
    } else if (result.action === 'end' && result.duration !== undefined) {
      notifyDebateEnd('wife', result.duration);
      await sendPushIfBackground(
        '✅ Debate Ended',
        `${getPartnerName('wife')}'s debate ended. Duration: ${formatDuration(result.duration)}`,
        'debate_end_wife',
        { type: 'debate_end', partner: 'wife', duration: result.duration }
      );
    }
  };

  const todayStats = getTodayStats();

  return (
    <div className="min-h-screen px-4 pb-8">
      <div className="max-w-2xl mx-auto">
        <Header 
          permission={permission} 
          onRequestPermission={requestPermission}
          onOpenCalendar={() => setShowCalendar(true)}
        />

        {/* Demo Mode Indicator */}
        {isDemoMode ? (
          <Alert className="mt-4 border-indigo-200 bg-indigo-50">
            <Info className="h-4 w-4 text-indigo-600" />
            <AlertDescription className="text-indigo-800">
              <strong>Demo Mode Active:</strong> You're viewing sample data. Toggle switches are disabled. 
              Switch to real user mode to start tracking your debates and sync data across devices via Supabase.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mt-4 border-emerald-200 bg-emerald-50">
            <Info className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <strong>Real User Mode:</strong> All data is being saved to Supabase cloud database. 
              Both partners can access the same shared data from any device. Data syncs in real-time.
            </AlertDescription>
          </Alert>
        )}

        {/* Both Active Indicator */}
        <AnimatePresence>
          <BothActiveIndicator isActive={bothActive} />
        </AnimatePresence>

        {/* Main Toggle Section */}
        <div className="flex justify-center gap-8 md:gap-16 py-8 md:py-12">
          <DebateToggle
            partner="husband"
            isActive={husbandActive}
            time={husbandTime}
            lastSession={lastHusbandSession}
            onToggle={handleHusbandToggle}
          />
          <DebateToggle
            partner="wife"
            isActive={wifeActive}
            time={wifeTime}
            lastSession={lastWifeSession}
            onToggle={handleWifeToggle}
          />
        </div>

        {/* Stats and History */}
        <div className="space-y-4 mt-4">
          <StatsCard todayStats={todayStats} />
          <SessionHistory sessions={sessions} />
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Calendar Modal */}
        <AnimatePresence>
          {showCalendar && (
            <CalendarView 
              sessions={sessions} 
              onClose={() => setShowCalendar(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
