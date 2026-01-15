import { motion } from 'framer-motion';
import { User, Heart } from 'lucide-react';
import { Partner } from '@/types/debate';
import { formatTime } from '@/hooks/useNotifications';
import { getPartnerName } from '@/lib/partnerSettings';

interface DebateToggleProps {
  partner: Partner;
  isActive: boolean;
  time: number;
  lastSession?: { duration?: number; endTime?: Date } | null;
  onToggle: () => void;
}

export const DebateToggle = ({
  partner,
  isActive,
  time,
  lastSession,
  onToggle,
}: DebateToggleProps) => {
  const isHusband = partner === 'husband';
  const Icon = isHusband ? User : Heart;

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const showLastSession = lastSession?.endTime &&
    (Date.now() - new Date(lastSession.endTime).getTime()) < 20000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: isHusband ? 0.1 : 0.2 }}
      className="flex flex-col items-center"
    >
      {/* Last Session Indicator */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: showLastSession ? 1 : 0,
          height: showLastSession ? 'auto' : 0
        }}
        className="mb-4 overflow-hidden"
      >
        {lastSession && (
          <div className={`
            text-sm px-4 py-2 rounded-full
            ${isHusband ? 'bg-husband-light text-husband' : 'bg-wife-light text-wife'}
          `}>
            Last debate: {lastSession.duration ? formatTime(lastSession.duration) : '0s'} - {lastSession.endTime ? getTimeAgo(lastSession.endTime) : ''}
          </div>
        )}
      </motion.div>

      {/* Main Toggle Button */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative w-44 h-44 rounded-3xl
          flex flex-col items-center justify-center gap-3
          font-display font-semibold text-lg
          transition-all duration-300 ease-out
          ${isActive
            ? isHusband
              ? 'bg-husband text-white shadow-husband'
              : 'bg-wife text-white shadow-wife'
            : 'bg-card text-foreground shadow-soft hover:shadow-elevated'
          }
        `}
      >
        {/* Wave animation behind button when active */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-3xl overflow-hidden z-0"
            style={{
              pointerEvents: 'none',
            }}
          >
            <motion.div
              className={`absolute rounded-full ${isHusband ? 'bg-husband' : 'bg-wife'}`}
              style={{
                width: '100%',
                height: '100%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 1.5],
                opacity: [0.2, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeOut',
                repeatDelay: 0,
              }}
            />
          </motion.div>
        )}

        {/* Icon */}
        <div className={`
          relative z-10 p-4 rounded-2xl
          ${isActive
            ? 'bg-white/20'
            : isHusband
              ? 'bg-husband-light text-husband'
              : 'bg-wife-light text-wife'
          }
        `}>
          <Icon className="w-8 h-8" strokeWidth={2} />
        </div>

        {/* Label */}
        <span className="relative z-10 text-xl">
          {getPartnerName(partner)}
        </span>


      </motion.button>

      {/* Timer Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0.3 }}
        className={`
          mt-6 timer-display text-4xl font-bold
          ${isHusband ? 'text-husband' : 'text-wife'}
        `}
      >
        {formatTime(time)}
      </motion.div>
    </motion.div>
  );
};
