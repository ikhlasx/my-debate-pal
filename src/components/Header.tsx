import { motion } from 'framer-motion';
import { Heart, Settings, Bell, BellRing, Calendar, BarChart3, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useDemoMode } from '@/hooks/useDemoMode';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
  permission: NotificationPermission;
  onRequestPermission: () => void;
  onOpenCalendar: () => void;
  onOpenSettings?: () => void;
}

export const Header = ({ permission, onRequestPermission, onOpenCalendar }: HeaderProps) => {
  const { isSubscribed, isSupported, subscribe, isLoading } = usePushNotifications();
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  const handleNotificationClick = async () => {
    if (isSubscribed) {
      // Already subscribed, go to settings
      return;
    }

    if (permission !== 'granted') {
      onRequestPermission();
    }

    if (isSupported && !isSubscribed) {
      await subscribe();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-6"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-husband to-wife flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight">
            കച്ചറ app
          </h1>
          <p className="text-sm text-muted-foreground">
            Keep it civil, keep it timed
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Demo Mode Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:bg-secondary/50 transition-colors">
                <User className={`w-4 h-4 ${isDemoMode ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                <Switch
                  checked={isDemoMode}
                  onCheckedChange={toggleDemoMode}
                  id="demo-mode"
                  className="data-[state=checked]:bg-indigo-600"
                />
                <Label
                  htmlFor="demo-mode"
                  className={`text-xs font-medium cursor-pointer ${isDemoMode ? 'text-indigo-600' : 'text-muted-foreground'}`}
                >
                  <span className="hidden sm:inline">Demo</span>
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isDemoMode
                ? 'Demo mode: Showing sample data. Click to switch to real user mode.'
                : 'Enable demo mode to see sample analytics and calendar data'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Push Notification Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {isSubscribed ? (
                <Link to="/settings">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl relative"
                    title="Push notifications enabled"
                  >
                    <BellRing className="w-5 h-5 text-emerald-500" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNotificationClick}
                  disabled={isLoading}
                  className="gap-2 rounded-xl"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isLoading ? 'Enabling...' : 'Enable Alerts'}
                  </span>
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {isSubscribed
                ? 'Push notifications are enabled. Click to manage.'
                : 'Enable push notifications to get alerts'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Link to="/analytics">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            title="Analytics Dashboard"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={onOpenCalendar}
        >
          <Calendar className="w-5 h-5" />
        </Button>
        <Link to="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </motion.header>
  );
};
