import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  BellRing, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Smartphone,
  Send,
  Loader2,
  Info,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationPanelProps {
  className?: string;
}

export const PushNotificationPanel: React.FC<PushNotificationPanelProps> = ({ className }) => {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError,
  } = usePushNotifications();

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (!success) {
      console.error('Failed to send test notification');
    }
  };

  // Status indicator component
  const StatusIndicator = () => {
    if (!isSupported) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <XCircle className="w-5 h-5" />
          <span>Not Supported</span>
        </div>
      );
    }

    if (permission === 'denied') {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <BellOff className="w-5 h-5" />
          <span>Blocked</span>
        </div>
      );
    }

    if (isSubscribed) {
      return (
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="w-5 h-5" />
          <span>Active</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-amber-500">
        <AlertCircle className="w-5 h-5" />
        <span>Inactive</span>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <BellRing className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Push Notifications</CardTitle>
              <CardDescription>Get alerts even when the app is closed</CardDescription>
            </div>
          </div>
          <StatusIndicator />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  <Button
                    onClick={clearError}
                    variant="link"
                    size="sm"
                    className="text-red-600 dark:text-red-400 p-0 h-auto mt-1"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not supported message */}
        {!isSupported && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Push notifications are not supported in this browser. Try using Chrome, Firefox, or Edge for the best experience.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permission denied message */}
        {isSupported && permission === 'denied' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">
                  Notifications are blocked
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                  To enable push notifications:
                </p>
                <ol className="text-sm text-amber-600 dark:text-amber-400 list-decimal list-inside space-y-1">
                  <li>Click the lock/info icon in your address bar</li>
                  <li>Find "Notifications" in the permissions</li>
                  <li>Change it to "Allow"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Features list */}
        {isSupported && permission !== 'denied' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSubscribed 
                ? "You're receiving push notifications for:"
                : "Enable push notifications to receive alerts for:"}
            </p>
            <div className="grid gap-2">
              {[
                { icon: Bell, text: 'Debate starts and ends' },
                { icon: AlertCircle, text: 'Time milestones (5, 15, 30 min)' },
                { icon: Smartphone, text: 'Both partners debating alert' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <item.icon className="w-4 h-4 text-violet-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isSupported && permission !== 'denied' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleToggleSubscription}
              disabled={isLoading}
              className={`flex-1 gap-2 ${
                isSubscribed
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
            </Button>

            {isSubscribed && (
              <Button
                onClick={handleTestNotification}
                variant="outline"
                disabled={isLoading}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Test
              </Button>
            )}
          </div>
        )}

        {/* Info footer */}
        {isSupported && isSubscribed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-2 border-t border-gray-100 dark:border-gray-800"
          >
            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Notifications will appear even when this tab is closed
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

