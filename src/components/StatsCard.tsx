import { motion } from 'framer-motion';
import { TrendingUp, Clock, Zap } from 'lucide-react';
import { formatDuration } from '@/hooks/useNotifications';
import { getPartnerName } from '@/lib/partnerSettings';

interface StatsCardProps {
  todayStats: {
    husbandCount: number;
    wifeCount: number;
    husbandTotalTime: number;
    wifeTotalTime: number;
    totalSessions: number;
  };
}

export const StatsCard = ({ todayStats }: StatsCardProps) => {
  const totalTime = todayStats.husbandTotalTime + todayStats.wifeTotalTime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card-elevated p-6"
    >
      <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-muted-foreground" />
        Today's Summary
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {/* Total Sessions */}
        <div className="text-center p-4 rounded-2xl bg-secondary">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Zap className="w-4 h-4 text-warning" />
          </div>
          <div className="font-display text-2xl font-bold">
            {todayStats.totalSessions}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total Sessions
          </div>
        </div>

        {/* Husband Stats */}
        <div className="text-center p-4 rounded-2xl bg-husband-light">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="w-4 h-4 text-husband" />
          </div>
          <div className="font-display text-2xl font-bold text-husband">
            {todayStats.husbandCount}
          </div>
          <div className="text-xs text-husband/70 mt-1">
            {getPartnerName('husband')} ({formatDuration(todayStats.husbandTotalTime)})
          </div>
        </div>

        {/* Wife Stats */}
        <div className="text-center p-4 rounded-2xl bg-wife-light">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="w-4 h-4 text-wife" />
          </div>
          <div className="font-display text-2xl font-bold text-wife">
            {todayStats.wifeCount}
          </div>
          <div className="text-xs text-wife/70 mt-1">
            {getPartnerName('wife')} ({formatDuration(todayStats.wifeTotalTime)})
          </div>
        </div>
      </div>

      {/* Total time bar */}
      {totalTime > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Time Distribution</span>
            <span>{formatDuration(totalTime)} total</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: totalTime > 0 
                  ? `${(todayStats.husbandTotalTime / totalTime) * 100}%`
                  : '50%'
              }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-husband h-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: totalTime > 0 
                  ? `${(todayStats.wifeTotalTime / totalTime) * 100}%`
                  : '50%'
              }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-wife h-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
