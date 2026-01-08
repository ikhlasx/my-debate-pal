import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Volume2, Vibrate, Moon, Clock, BarChart3, Play, Zap } from 'lucide-react';
import { NotificationSettings as NotificationSettingsType } from '@/types/debate';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettingsType;
  onSettingsChange: (settings: NotificationSettingsType) => void;
  onTestSound?: () => void;
  onTestVibration?: () => void;
  onTestNotification?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onTestSound,
  onTestVibration,
  onTestNotification,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: keyof NotificationSettingsType, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleQuietHoursChange = (key: string, value: any) => {
    const updated = {
      ...localSettings,
      quietHours: { ...localSettings.quietHours, [key]: value },
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleDailySummaryChange = (key: string, value: any) => {
    const updated = {
      ...localSettings,
      dailySummary: { ...localSettings.dailySummary, [key]: value },
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleWeeklySummaryChange = (key: string, value: any) => {
    const updated = {
      ...localSettings,
      weeklySummary: { ...localSettings.weeklySummary, [key]: value },
    };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleMilestoneToggle = (milestone: number) => {
    const current = localSettings.timeMilestones;
    const updated = current.includes(milestone)
      ? current.filter(m => m !== milestone)
      : [...current, milestone].sort((a, b) => a - b);

    handleChange('timeMilestones', updated);
  };

  const handleReset = () => {
    const defaultSettings: NotificationSettingsType = {
      inAppEnabled: true,
      browserEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      volume: 0.8,
      quietHours: {
        enabled: true,
        start: '23:00',
        end: '07:00',
      },
      timeMilestones: [5, 15, 30],
      dailySummary: { enabled: true, time: '21:00' },
      weeklySummary: { enabled: true, day: 1, time: '09:00' },
    };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Monday';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6 space-y-6">
            {/* In-App Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">In-App Notifications</h3>
              </div>
              <div className="space-y-3 pl-7">
                <div className="flex items-center justify-between">
                  <Label htmlFor="in-app-enabled">Enable in-app toasts</Label>
                  <Switch
                    id="in-app-enabled"
                    checked={localSettings.inAppEnabled}
                    onCheckedChange={(checked) => handleChange('inAppEnabled', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Browser/OS Notifications */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Browser/OS Notifications</h3>
              </div>
              <div className="space-y-3 pl-7">
                <div className="flex items-center justify-between">
                  <Label htmlFor="browser-enabled">Enable browser notifications</Label>
                  <Switch
                    id="browser-enabled"
                    checked={localSettings.browserEnabled}
                    onCheckedChange={(checked) => handleChange('browserEnabled', checked)}
                  />
                </div>
                {Notification.permission === 'default' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ Permission required for browser notifications
                    </p>
                    <Button
                      onClick={onTestNotification}
                      size="sm"
                      className="mt-2"
                      variant="outline"
                    >
                      Grant Permission
                    </Button>
                  </div>
                )}
                {Notification.permission === 'denied' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      ❌ Browser notifications are blocked. To enable:
                      <br />
                      1. Click the lock icon in address bar
                      <br />
                      2. Allow notifications
                      <br />
                      3. Refresh the page
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sound Settings */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Sound Settings</h3>
              </div>
              <div className="space-y-4 pl-7">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-enabled">Enable notification sounds</Label>
                  <Switch
                    id="sound-enabled"
                    checked={localSettings.soundEnabled}
                    onCheckedChange={(checked) => handleChange('soundEnabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Volume: {Math.round(localSettings.volume * 100)}%</Label>
                    <Button
                      onClick={onTestSound}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      disabled={!localSettings.soundEnabled}
                    >
                      <Play className="w-3 h-3" />
                      Test Sound
                    </Button>
                  </div>
                  <Slider
                    value={[localSettings.volume * 100]}
                    onValueChange={(value) => handleChange('volume', value[0] / 100)}
                    max={100}
                    step={5}
                    disabled={!localSettings.soundEnabled}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Vibration (Mobile) */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Vibrate className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Vibration (Mobile)</h3>
              </div>
              <div className="space-y-3 pl-7">
                <div className="flex items-center justify-between">
                  <Label htmlFor="vibration-enabled">Enable vibration alerts</Label>
                  <Switch
                    id="vibration-enabled"
                    checked={localSettings.vibrationEnabled}
                    onCheckedChange={(checked) => handleChange('vibrationEnabled', checked)}
                  />
                </div>
                <Button
                  onClick={onTestVibration}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  disabled={!localSettings.vibrationEnabled || !('vibrate' in navigator)}
                >
                  <Vibrate className="w-3 h-3" />
                  Test Vibration
                </Button>
              </div>
            </div>

            {/* Time-Based Alerts */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold">Time-Based Alerts</h3>
              </div>
              <div className="space-y-3 pl-7">
                {[5, 15, 30].map(milestone => (
                  <div key={milestone} className="flex items-center justify-between">
                    <Label htmlFor={`milestone-${milestone}`}>{milestone}-minute milestone</Label>
                    <Switch
                      id={`milestone-${milestone}`}
                      checked={localSettings.timeMilestones.includes(milestone)}
                      onCheckedChange={() => handleMilestoneToggle(milestone)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Notifications */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-600" />
                <h3 className="text-lg font-semibold">Summary Notifications</h3>
              </div>
              <div className="space-y-4 pl-7">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="daily-summary">Daily summary</Label>
                    <Switch
                      id="daily-summary"
                      checked={localSettings.dailySummary.enabled}
                      onCheckedChange={(checked) => handleDailySummaryChange('enabled', checked)}
                    />
                  </div>
                  {localSettings.dailySummary.enabled && (
                    <Input
                      type="time"
                      value={localSettings.dailySummary.time}
                      onChange={(e) => handleDailySummaryChange('time', e.target.value)}
                      className="w-32"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekly-summary">Weekly summary</Label>
                    <Switch
                      id="weekly-summary"
                      checked={localSettings.weeklySummary.enabled}
                      onCheckedChange={(checked) => handleWeeklySummaryChange('enabled', checked)}
                    />
                  </div>
                  {localSettings.weeklySummary.enabled && (
                    <div className="flex gap-2">
                      <select
                        value={localSettings.weeklySummary.day}
                        onChange={(e) => handleWeeklySummaryChange('day', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map(day => (
                          <option key={day} value={day}>
                            {getDayName(day)}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="time"
                        value={localSettings.weeklySummary.time}
                        onChange={(e) => handleWeeklySummaryChange('time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold">Quiet Hours</h3>
              </div>
              <div className="space-y-4 pl-7">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours-enabled">Enable quiet mode</Label>
                  <Switch
                    id="quiet-hours-enabled"
                    checked={localSettings.quietHours.enabled}
                    onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
                  />
                </div>
                {localSettings.quietHours.enabled && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="w-16">From:</Label>
                      <Input
                        type="time"
                        value={localSettings.quietHours.start}
                        onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                        className="w-32"
                      />
                      <Label className="w-16">To:</Label>
                      <Input
                        type="time"
                        value={localSettings.quietHours.end}
                        onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      During quiet hours, sounds and vibrations will be muted
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-800 px-6 py-4 flex items-center justify-between border-t">
            <Button onClick={handleReset} variant="outline">
              Reset to Defaults
            </Button>
            <Button onClick={onClose} className="bg-gradient-to-r from-blue-600 to-purple-600">
              Save Settings
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
