import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Users } from 'lucide-react';
import { getPartnerSettings, savePartnerSettings, PartnerSettings } from '@/lib/partnerSettings';
import { useToast } from '@/hooks/use-toast';
import { PushNotificationPanel } from '@/components/PushNotificationPanel';
import { BackButton } from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const [settings, setSettings] = useState<PartnerSettings>(getPartnerSettings());
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleSave = () => {
    savePartnerSettings(settings);
    toast({
      title: 'Settings saved',
      description: 'Partner names have been updated successfully.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 dark:from-slate-950 dark:via-gray-950 dark:to-zinc-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton to="/" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your experience</p>
          </div>
        </div>

        {/* Push Notifications */}
        <PushNotificationPanel />

        {/* Partner Names */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Partner Names</CardTitle>
                <CardDescription>
                  Change the names displayed for each partner
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="partner1">Partner 1 Name</Label>
              <Input
                id="partner1"
                value={settings.partner1Name}
                onChange={(e) => setSettings({ ...settings, partner1Name: e.target.value })}
                placeholder="Husband"
                className="rounded-lg"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This name will be used for the first partner (previously "Husband")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner2">Partner 2 Name</Label>
              <Input
                id="partner2"
                value={settings.partner2Name}
                onChange={(e) => setSettings({ ...settings, partner2Name: e.target.value })}
                placeholder="Wife"
                className="rounded-lg"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This name will be used for the second partner (previously "Wife")
              </p>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Account Management</CardTitle>
                <CardDescription>
                  Manage your account and local data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
                    localStorage.clear();
                    toast({
                      title: 'Data cleared',
                      description: 'All local data has been cleared.',
                    });
                    window.location.reload();
                  }
                }}
                variant="outline"
                className="w-full rounded-lg border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
              >
                Clear Local Data
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will clear all cached data from your browser. Your cloud data will remain safe.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                onClick={async () => {
                  await signOut();
                  toast({
                    title: 'Logged out',
                    description: 'You have been logged out successfully.',
                  });
                }}
                variant="destructive"
                className="w-full rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                Logout
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign out from your account. You'll need to log in again to access your data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

