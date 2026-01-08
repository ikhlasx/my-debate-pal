import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onAllow,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bell className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-3">Enable Notifications?</h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Get notified about debates even when the app is in background
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Know when your partner starts a debate
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Receive time milestone alerts (5, 15, 30 minutes)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Get daily and weekly summaries
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onDeny}
              variant="outline"
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" />
              Not Now
            </Button>
            <Button
              onClick={onAllow}
              className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Bell className="w-4 h-4" />
              Allow
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
            You can change this later in settings
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
