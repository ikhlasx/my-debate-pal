# Implementation Guide

## Quick Start - Enabling Enhanced Features

Follow these steps to activate all the new features in your Couple's Debate Tracker app:

---

## Step 1: Update the Main App Route

### Option A: Replace Existing Index (Recommended)

Update your [src/App.tsx](src/App.tsx) or routing configuration to use the enhanced version:

```tsx
// Before
import Index from "@/pages/Index";

// After
import Index from "@/pages/IndexEnhanced";

// Or rename IndexEnhanced to Index
```

### Option B: Create New Route

Add a new route while keeping the old one:

```tsx
import Index from "@/pages/Index";
import IndexEnhanced from "@/pages/IndexEnhanced";

// In your router
<Route path="/" element={<Index />} />
<Route path="/enhanced" element={<IndexEnhanced />} />
```

---

## Step 2: Verify Dependencies

All required dependencies are already in your [package.json](package.json). No additional installations needed!

Key dependencies being used:
- `framer-motion` - Animations
- `date-fns` - Date utilities
- `lucide-react` - Icons
- React hooks and context

---

## Step 3: Service Worker Setup (Optional but Recommended)

The service worker is already created at [public/service-worker.js](public/service-worker.js).

### For Development:
Service workers work automatically in the development server.

### For Production (Vite):
Service workers require HTTPS. When you deploy:

1. Ensure your hosting supports HTTPS
2. The service worker will auto-register
3. Users will be able to receive background notifications

---

## Step 4: Test the Features

### 1. **Basic Functionality**
- Open the app
- Click Husband or Wife toggle
- Verify the timer starts
- Check that toast notifications appear

### 2. **Notification Permissions**
- Wait 3 seconds for the permission modal
- Click "Allow" to grant browser notifications
- Look for the test notification

### 3. **Settings Panel**
- Click the gear icon in the header
- Explore notification settings
- Test sound using the "Test Sound" button
- Test vibration on mobile (if available)

### 4. **Calendar & Analytics**
- Click the calendar icon
- View color-coded activity
- Click on any date with activity
- Verify overlap time is displayed when both partners debated

### 5. **Time Milestones**
- Start a debate
- Wait 5 minutes → expect notification
- Continue to 15 minutes → expect another notification
- Continue to 30 minutes → expect warning notification

---

## Step 5: Customize Settings (Optional)

### Default Notification Settings

Edit [src/hooks/useEnhancedNotifications.ts](src/hooks/useEnhancedNotifications.ts) line 8-18:

```typescript
const DEFAULT_SETTINGS: NotificationSettings = {
  inAppEnabled: true,
  browserEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 0.8,                          // 0.0 to 1.0
  quietHours: {
    enabled: true,
    start: '23:00',                     // 11 PM
    end: '07:00',                       // 7 AM
  },
  timeMilestones: [5, 15, 30],         // Minutes
  dailySummary: {
    enabled: true,
    time: '21:00'                       // 9 PM
  },
  weeklySummary: {
    enabled: true,
    day: 1,                             // Monday (0 = Sunday)
    time: '09:00'                       // 9 AM
  },
};
```

### Custom Sound Frequencies

Edit [src/lib/SoundPlayer.ts](src/lib/SoundPlayer.ts) line 28-40:

```typescript
const soundDefinitions = {
  'debate_start': { frequency: 440, duration: 0.3, type: 'sine' },
  'debate_end': { frequency: 523, duration: 0.5, type: 'sine' },
  // ... add more
};
```

### Custom Vibration Patterns

Edit [src/lib/NotificationManager.ts](src/lib/NotificationManager.ts) line 122-133:

```typescript
const patterns: Record<string, number[]> = {
  debate_start: [100],
  debate_end: [200],
  both_active: [100, 50, 100],
  // ... add more
};
```

---

## Step 6: Browser-Specific Setup

### Chrome/Edge
✅ Works out of the box

### Firefox
✅ Works out of the box

### Safari Desktop
✅ Works with macOS Ventura+ (13.0+)
- Notifications require user permission
- All features supported

### Safari Mobile (iOS)
⚠️ Requires iOS 16.4 or later
- Add to Home Screen for full notification support
- Vibration may not work on all devices

**To Add to Home Screen on iOS:**
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Open from Home Screen icon

---

## Step 7: Production Deployment Checklist

### Before Deploying:

- [ ] Test all features in development
- [ ] Verify HTTPS is enabled on hosting
- [ ] Check that service worker registers
- [ ] Test notifications in background
- [ ] Verify localStorage persistence
- [ ] Test on mobile devices
- [ ] Check browser compatibility

### Recommended Hosting Platforms:
- **Vercel** - ✅ HTTPS automatic, great for Vite
- **Netlify** - ✅ HTTPS automatic, easy setup
- **GitHub Pages** - ✅ HTTPS automatic (requires custom domain for notifications)
- **Railway** - ✅ HTTPS automatic
- **Render** - ✅ HTTPS automatic

### Build Command:
```bash
npm run build
```

The build output will be in the `dist/` directory.

---

## Troubleshooting

### Issue: Notifications Not Showing

**Solutions:**
1. Check browser permission: Look for blocked icon in address bar
2. Verify HTTPS in production (required for service workers)
3. Check console for errors
4. Clear browser cache and reload
5. Ensure "Do Not Disturb" is off on device

### Issue: Sounds Not Playing

**Solutions:**
1. Check volume in settings (gear icon)
2. Verify sound is enabled in settings
3. Test using "Test Sound" button
4. Check browser autoplay policy (click on page first)
5. Verify quiet hours are not active

### Issue: Service Worker Not Registering

**Solutions:**
1. Check that you're on HTTPS (required in production)
2. Look for console errors
3. Verify [public/service-worker.js](public/service-worker.js) exists
4. Clear browser cache
5. Check browser compatibility (Chrome 90+, Firefox 88+, Safari 14+)

### Issue: Calendar Not Showing Data

**Solutions:**
1. Create some debate sessions first
2. Wait for sessions to complete
3. Check localStorage: `localStorage.getItem('debate-sessions')`
4. Verify date filtering logic
5. Check browser console for errors

### Issue: Overlap Time Shows 0

**Solutions:**
1. Ensure both partners debated during the same time period
2. Both sessions must have ended (have endTime)
3. Check that [src/lib/sessionUtils.ts](src/lib/sessionUtils.ts) is imported correctly
4. Verify session timestamps are valid dates

---

## Advanced Customization

### Add Custom Partner Names

1. Update [src/types/debate.ts](src/types/debate.ts):
```typescript
export interface AppSettings {
  partner1Name: string;
  partner2Name: string;
}
```

2. Add to localStorage and UI components

### Add Export Functionality

Create a new utility:

```typescript
// src/lib/exportUtils.ts
export const exportToCSV = (sessions: DebateSession[]) => {
  const csv = sessions.map(s =>
    `${s.partner},${s.startTime},${s.endTime},${s.duration}`
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'debate-sessions.csv';
  a.click();
};
```

Add button to UI and call this function.

### Add Debate Topics/Tags

1. Update session type:
```typescript
export interface DebateSession {
  // ... existing fields
  topic?: string;
  tags?: string[];
}
```

2. Add input field to debate toggle
3. Display in session history and calendar

---

## API Reference

### useEnhancedNotifications Hook

```typescript
const {
  // State
  toasts,                    // Array of active toast notifications
  permission,                // NotificationPermission status
  settings,                  // Current notification settings
  showPermissionModal,       // Boolean for permission modal visibility

  // Actions
  requestPermission,         // Request browser notification permission
  dismissToast,             // Dismiss a specific toast by ID
  updateSettings,           // Update notification settings
  setShowPermissionModal,   // Show/hide permission modal

  // Notifications
  notifyDebateStart,        // Notify when debate starts
  notifyDebateEnd,          // Notify when debate ends
  notifyBothActive,         // Notify when both are debating
  checkMilestones,          // Check and notify time milestones
  sendDailySummary,         // Send daily summary notification
  sendWeeklySummary,        // Send weekly summary notification
  notifyNewRecord,          // Notify about new records
  notifyPeacefulDay,        // Notify about peaceful day
  notifyStreak,             // Notify about debate streak

  // Testing
  testSound,                // Play test sound
  testVibration,            // Test vibration pattern
  testNotification,         // Send test notification
} = useEnhancedNotifications();
```

### sessionUtils Functions

```typescript
import {
  calculateSessionOverlap,      // Calculate overlap between 2 sessions
  calculateTotalOverlapTime,     // Calculate total overlap for arrays
  getOverlapPeriods,            // Get detailed overlap periods
  calculateSessionStats,         // Get statistics for sessions
  groupSessionsByDate,          // Group sessions by date
} from '@/lib/sessionUtils';
```

---

## Performance Considerations

### localStorage Size
- Each session ~150 bytes
- 10MB limit = ~60,000 sessions
- Consider cleanup after 1 year

### Toast Queue
- Max 5 toasts visible at once
- Auto-dismiss after 5 seconds
- Older toasts removed if exceeded

### Service Worker
- Caches are auto-managed
- Updates check every hour
- Old versions cleaned up automatically

---

## Security Notes

### Data Privacy
- ✅ All data stored locally
- ✅ No server communication
- ✅ No tracking or analytics
- ✅ No third-party services

### Permissions
- Browser notifications require explicit user consent
- Settings stored in localStorage (accessible only to your domain)
- Service worker scoped to your origin

---

## Support & Resources

### Documentation
- [FEATURES.md](FEATURES.md) - Complete feature list
- [README.md](README.md) - Project overview
- Code comments throughout the codebase

### Key Files
- [src/pages/IndexEnhanced.tsx](src/pages/IndexEnhanced.tsx) - Main app component
- [src/hooks/useEnhancedNotifications.ts](src/hooks/useEnhancedNotifications.ts) - Notification logic
- [src/lib/NotificationManager.ts](src/lib/NotificationManager.ts) - Core manager
- [src/components/NotificationSettings.tsx](src/components/NotificationSettings.tsx) - Settings UI
- [src/lib/sessionUtils.ts](src/lib/sessionUtils.ts) - Overlap calculations

### Browser DevTools
- **Application tab** → Service Workers (check registration)
- **Application tab** → Local Storage (view data)
- **Console** → Look for notification logs
- **Network tab** → Verify service worker requests

---

**Happy Debugging! 🎉**

If you encounter any issues not covered here, check the browser console for error messages and verify all files are in the correct locations.
