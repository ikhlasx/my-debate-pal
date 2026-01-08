import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Heart, 
  Clock, 
  TrendingUp,
  X,
  Flame,
  Zap
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { DebateSession } from '@/types/debate';
import { formatDuration } from '@/hooks/useNotifications';
import { calculateTotalOverlapTime } from '@/lib/sessionUtils';

interface CalendarViewProps {
  sessions: DebateSession[];
  onClose: () => void;
}

interface DayAnalytics {
  date: Date;
  husbandSessions: DebateSession[];
  wifeSessions: DebateSession[];
  totalTime: number;
  husbandTime: number;
  wifeTime: number;
  overlapTime: number;
}

export const CalendarView = ({ sessions, onClose }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get analytics for a specific date
  const getDayAnalytics = (date: Date): DayAnalytics => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const daySessions = sessions.filter(
      s => format(new Date(s.startTime), 'yyyy-MM-dd') === dayStr && s.duration
    );

    const husbandSessions = daySessions.filter(s => s.partner === 'husband');
    const wifeSessions = daySessions.filter(s => s.partner === 'wife');

    return {
      date,
      husbandSessions,
      wifeSessions,
      totalTime: daySessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      husbandTime: husbandSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      wifeTime: wifeSessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      overlapTime: calculateTotalOverlapTime(husbandSessions, wifeSessions),
    };
  };

  // Get day color based on activity
  const getDayColor = (date: Date): string => {
    const analytics = getDayAnalytics(date);
    const totalSessions = analytics.husbandSessions.length + analytics.wifeSessions.length;
    const totalTime = analytics.totalTime;
    const hasOverlap = analytics.overlapTime > 0;
    
    // Purple: Both partners active simultaneously
    if (hasOverlap) {
      return 'bg-purple-400 dark:bg-purple-600';
    }
    
    // Green: No debates (peaceful day)
    if (totalSessions === 0) {
      return 'bg-green-100 dark:bg-green-900/30';
    }
    
    // Red: 6+ debates OR >1 hour total (high activity)
    if (totalSessions >= 6 || totalTime > 3600) {
      return 'bg-red-400 dark:bg-red-600';
    }
    
    // Orange: 3-5 debates (moderate activity)
    if (totalSessions >= 3 && totalSessions <= 5) {
      return 'bg-orange-300 dark:bg-orange-700/50';
    }
    
    // Yellow: 1-2 debates (light activity)
    if (totalSessions >= 1 && totalSessions <= 2) {
      return 'bg-yellow-200 dark:bg-yellow-800/40';
    }
    
    return 'bg-gray-100 dark:bg-gray-800';
  };

  const selectedAnalytics = selectedDate ? getDayAnalytics(selectedDate) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-4 md:inset-8 bg-card rounded-3xl shadow-elevated overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-display text-2xl font-bold">Debate Calendar</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const analytics = getDayAnalytics(day);
                const hasHusband = analytics.husbandSessions.length > 0;
                const hasWife = analytics.wifeSessions.length > 0;
                const hasOverlap = analytics.overlapTime > 0;
                const dayColor = getDayColor(day);
                const isDarkColor = dayColor.includes('red') || dayColor.includes('purple') || dayColor.includes('orange-');

                return (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative aspect-square rounded-xl p-2 flex flex-col items-center justify-center
                      transition-all duration-200 hover:opacity-80
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                      ${isToday(day) ? 'ring-2 ring-warning ring-offset-1' : ''}
                      ${dayColor}
                    `}
                  >
                    <span className={`
                      text-sm font-medium
                      ${isDarkColor ? 'text-white' : 'text-gray-900 dark:text-gray-100'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Activity Dots */}
                    {(hasHusband || hasWife) && (
                      <div className="flex gap-0.5 mt-1">
                        {hasHusband && (
                          <div className="w-1.5 h-1.5 rounded-full bg-husband" />
                        )}
                        {hasWife && (
                          <div className="w-1.5 h-1.5 rounded-full bg-wife" />
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
                <span className="text-muted-foreground">No debates (peaceful)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-800/40" />
                <span className="text-muted-foreground">1-2 debates (light)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-300 dark:bg-orange-700/50" />
                <span className="text-muted-foreground">3-5 debates (moderate)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-400 dark:bg-red-600" />
                <span className="text-muted-foreground">6+ debates or &gt;1h (high)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-400 dark:bg-purple-600" />
                <span className="text-muted-foreground">Both active (simultaneous)</span>
              </div>
            </div>
          </div>

          {/* Day Analytics Panel */}
          <AnimatePresence mode="wait">
            {selectedAnalytics && (
              <motion.div
                key={format(selectedAnalytics.date, 'yyyy-MM-dd')}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border p-6 overflow-auto bg-secondary/30"
              >
                <DayAnalyticsPanel analytics={selectedAnalytics} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface DayAnalyticsPanelProps {
  analytics: DayAnalytics;
}

const DayAnalyticsPanel = ({ analytics }: DayAnalyticsPanelProps) => {
  const totalSessions = analytics.husbandSessions.length + analytics.wifeSessions.length;
  const allSessions = [...analytics.husbandSessions, ...analytics.wifeSessions]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div>
        <h3 className="font-display text-2xl font-bold">
          {format(analytics.date, 'EEEE')}
        </h3>
        <p className="text-muted-foreground">
          {format(analytics.date, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 text-center">
          <Zap className="w-5 h-5 mx-auto mb-2 text-warning" />
          <div className="font-display text-2xl font-bold">{totalSessions}</div>
          <div className="text-xs text-muted-foreground">Total Debates</div>
        </div>
        <div className="bg-card rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 mx-auto mb-2 text-info" />
          <div className="font-display text-2xl font-bold">
            {analytics.totalTime > 0 ? formatDuration(analytics.totalTime) : '0s'}
          </div>
          <div className="text-xs text-muted-foreground">Total Time</div>
        </div>
      </div>

      {/* Overlap Time */}
      {analytics.overlapTime > 0 && (
        <div className="bg-gradient-to-r from-husband/10 to-wife/10 rounded-xl p-4 border-2 border-dashed border-warning/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Both Debating Time</div>
              <div className="text-sm text-muted-foreground">
                Time when both were actively debating
              </div>
            </div>
            <div className="font-display font-bold text-warning text-lg">
              {formatDuration(analytics.overlapTime)}
            </div>
          </div>
        </div>
      )}

      {/* Partner Breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Partner Breakdown
        </h4>
        
        <div className="bg-husband-light rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-husband/10">
              <User className="w-5 h-5 text-husband" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Husband</div>
              <div className="text-sm text-muted-foreground">
                {analytics.husbandSessions.length} sessions
              </div>
            </div>
            <div className="font-display font-bold text-husband">
              {formatDuration(analytics.husbandTime)}
            </div>
          </div>
        </div>

        <div className="bg-wife-light rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-wife/10">
              <Heart className="w-5 h-5 text-wife" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Wife</div>
              <div className="text-sm text-muted-foreground">
                {analytics.wifeSessions.length} sessions
              </div>
            </div>
            <div className="font-display font-bold text-wife">
              {formatDuration(analytics.wifeTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Time Distribution Bar */}
      {analytics.totalTime > 0 && (
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Time Distribution</span>
          </div>
          <div className="h-4 bg-card rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${(analytics.husbandTime / analytics.totalTime) * 100}%`
              }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-husband h-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${(analytics.wifeTime / analytics.totalTime) * 100}%`
              }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-wife h-full"
            />
          </div>
        </div>
      )}

      {/* Session Timeline */}
      {allSessions.length > 0 ? (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" />
            Session Timeline
          </h4>
          <div className="space-y-2 max-h-60 overflow-auto">
            {allSessions.map((session, index) => {
              const isHusband = session.partner === 'husband';
              const Icon = isHusband ? User : Heart;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl
                    ${isHusband ? 'bg-husband-light' : 'bg-wife-light'}
                  `}
                >
                  <div className={`
                    p-1.5 rounded-lg
                    ${isHusband ? 'bg-husband/10 text-husband' : 'bg-wife/10 text-wife'}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(session.startTime), 'h:mm a')}
                      {session.endTime && ` - ${format(new Date(session.endTime), 'h:mm a')}`}
                    </div>
                  </div>
                  <div className={`
                    font-display font-semibold text-sm
                    ${isHusband ? 'text-husband' : 'text-wife'}
                  `}>
                    {formatDuration(session.duration || 0)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🕊️</div>
          <p className="text-muted-foreground">Peaceful day!</p>
          <p className="text-sm text-muted-foreground mt-1">No debates recorded</p>
        </div>
      )}

      {/* Insights */}
      {totalSessions > 0 && (
        <div className="bg-card rounded-xl p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-warning" />
            Insights
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {analytics.husbandSessions.length > analytics.wifeSessions.length && (
              <li>• Husband initiated more debates this day</li>
            )}
            {analytics.wifeSessions.length > analytics.husbandSessions.length && (
              <li>• Wife initiated more debates this day</li>
            )}
            {analytics.husbandSessions.length === analytics.wifeSessions.length && totalSessions > 0 && (
              <li>• Equal number of debates from both</li>
            )}
            {analytics.totalTime > 1800 && (
              <li>• Over 30 minutes of total debate time</li>
            )}
            {totalSessions >= 4 && (
              <li>• High debate activity day 🔥</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
