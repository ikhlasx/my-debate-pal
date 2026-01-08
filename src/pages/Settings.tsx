import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPartnerSettings, savePartnerSettings, PartnerSettings } from '@/lib/partnerSettings';
import { useToast } from '@/hooks/use-toast';
import { PushNotificationPanel } from '@/components/PushNotificationPanel';

const Settings = () => {
  const [settings, setSettings] = useState<PartnerSettings>(getPartnerSettings());
  const { toast } = useToast();

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
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
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
      </div>
    </div>
  );
};

export default Settings;

