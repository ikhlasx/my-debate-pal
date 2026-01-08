import { motion } from 'framer-motion';
import { Clock, User, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { DebateSession } from '@/types/debate';
import { formatDuration } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SessionHistoryProps {
  sessions: DebateSession[];
}

export const SessionHistory = ({ sessions }: SessionHistoryProps) => {
  // Get last 5 completed sessions
  const recentSessions = sessions
    .filter(s => s.duration)
    .slice(-5)
    .reverse();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollUp(scrollTop > 0);
      setShowScrollDown(scrollTop < scrollHeight - clientHeight - 10);
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      // Check on resize
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [recentSessions]);

  const scrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: -100, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 100, behavior: 'smooth' });
    }
  };

  if (recentSessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-elevated p-6"
      >
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Recent Sessions
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">🕊️</div>
          <p>No debates yet today!</p>
          <p className="text-sm mt-1">Keep the peace going...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="card-elevated p-6 relative"
    >
      <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-muted-foreground" />
        Recent Sessions
      </h3>

      <div className="relative">
        {/* Scroll Up Button */}
        {showScrollUp && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
            onClick={scrollUp}
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          style={{ scrollbarWidth: 'thin' }}
        >
          {recentSessions.map((session, index) => {
            const isHusband = session.partner === 'husband';
            const Icon = isHusband ? User : Heart;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${isHusband ? 'bg-husband-light' : 'bg-wife-light'}
                `}
              >
                <div className={`
                  p-2 rounded-lg
                  ${isHusband ? 'bg-husband/10 text-husband' : 'bg-wife/10 text-wife'}
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium capitalize text-sm">
                    {session.partner}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(session.startTime), 'h:mm a')}
                  </div>
                </div>
                <div className={`
                  font-display font-semibold
                  ${isHusband ? 'text-husband' : 'text-wife'}
                `}>
                  {formatDuration(session.duration || 0)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Scroll Down Button */}
        {showScrollDown && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-0 right-0 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
            onClick={scrollDown}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
