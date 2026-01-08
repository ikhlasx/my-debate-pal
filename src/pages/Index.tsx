import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDebateTracker } from '@/hooks/useDebateTracker';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from '@/components/Header';
import { DebateToggle } from '@/components/DebateToggle';
import { StatsCard } from '@/components/StatsCard';
import { SessionHistory } from '@/components/SessionHistory';
import { ToastContainer } from '@/components/ToastContainer';
import { BothActiveIndicator } from '@/components/BothActiveIndicator';

const Index = () => {
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

  const prevBothActiveRef = useRef(false);

  // Handle both active notification
  useEffect(() => {
    if (bothActive && !prevBothActiveRef.current) {
      notifyBothActive();
    }
    prevBothActiveRef.current = bothActive;
  }, [bothActive, notifyBothActive]);

  // Check milestones
  useEffect(() => {
    if (husbandActive) {
      checkMilestones('husband', husbandTime);
    }
  }, [husbandActive, husbandTime, checkMilestones]);

  useEffect(() => {
    if (wifeActive) {
      checkMilestones('wife', wifeTime);
    }
  }, [wifeActive, wifeTime, checkMilestones]);

  const handleHusbandToggle = () => {
    const result = toggleHusband();
    if (result.action === 'start') {
      notifyDebateStart('husband');
    } else if (result.action === 'end' && result.duration !== undefined) {
      notifyDebateEnd('husband', result.duration);
    }
  };

  const handleWifeToggle = () => {
    const result = toggleWife();
    if (result.action === 'start') {
      notifyDebateStart('wife');
    } else if (result.action === 'end' && result.duration !== undefined) {
      notifyDebateEnd('wife', result.duration);
    }
  };

  const todayStats = getTodayStats();

  return (
    <div className="min-h-screen px-4 pb-8">
      <div className="max-w-2xl mx-auto">
        <Header permission={permission} onRequestPermission={requestPermission} />

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
      </div>
    </div>
  );
};

export default Index;
