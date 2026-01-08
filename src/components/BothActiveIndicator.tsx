import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface BothActiveIndicatorProps {
  isActive: boolean;
}

export const BothActiveIndicator = ({ isActive }: BothActiveIndicatorProps) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40"
    >
      <motion.div
        animate={{ 
          boxShadow: [
            '0 0 0 0 rgba(251, 146, 60, 0.4)',
            '0 0 0 15px rgba(251, 146, 60, 0)',
          ]
        }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-gradient-to-r from-warning to-orange-400 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3"
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <Zap className="w-5 h-5" fill="currentColor" />
        </motion.div>
        <span className="font-display font-bold">Both Partners Debating!</span>
        <motion.div
          animate={{ rotate: [0, -15, 15, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <Zap className="w-5 h-5" fill="currentColor" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
