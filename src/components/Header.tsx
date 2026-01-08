import { motion } from 'framer-motion';
import { Heart, Settings, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  permission: NotificationPermission;
  onRequestPermission: () => void;
  onOpenCalendar: () => void;
  onOpenSettings?: () => void;
}

export const Header = ({ permission, onRequestPermission, onOpenCalendar, onOpenSettings }: HeaderProps) => {
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
            Debate Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            Keep it civil, keep it timed
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {permission !== 'granted' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestPermission}
            className="gap-2"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Enable Alerts</span>
          </Button>
        )}
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl"
          onClick={onOpenCalendar}
        >
          <Calendar className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={onOpenSettings}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </motion.header>
  );
};
