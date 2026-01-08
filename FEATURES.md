# Couple's Debate Tracker - Feature Documentation

## Overview
A comprehensive web application for tracking debate sessions between partners, featuring real-time timers, dual-layer notifications, calendar analytics, and detailed insights.

---

## 🎯 Core Features

### 1. **Dual Toggle System**
- **Independent Timers**: Husband and Wife toggles operate independently
- **Simultaneous Sessions**: Both partners can debate at the same time
- **Real-time Display**: HH:MM:SS format for active debates
- **Last Session Indicator**: Shows "Last debate: [duration] - [time ago]" for 20 seconds after ending
- **Visual Feedback**:
  - Pulse animations when active
  - Glow effects
  - Color-coded (Blue for Husband, Pink for Wife)

### 2. **Enhanced Notification System**

#### 🔔 Dual-Layer Architecture
**Layer 1: In-App Toast Notifications**
- Always visible when app is active/open
- Auto-dismiss after 5 seconds
- Manual close option
- Queue system for multiple notifications
- Stacked display with smooth animations
- Color-coded by type (info, success, warning, error)

**Layer 2: Browser/OS Notifications**
- Native browser push notifications
- Appears when browser tab is in background
- Works even when browser is minimized
- Click notification to bring app to foreground
- Requires user permission (one-time request)

#### Smart Notification Logic
```
IF app is in foreground/active:
  ├─ Show in-app toast notification
  └─ Skip browser notification (avoid duplication)

IF app is in background/minimized:
  ├─ Send browser/OS notification
  └─ Queue in-app notification for when user returns

IF user has denied browser notifications:
  └─ Only show in-app notifications
```

#### 📢 Notification Types

**Debate Start/End:**
- 🔴 "Husband started a debate" (blue toast)
- 🔴 "Wife started a debate" (pink toast)
- ✅ "Husband ended debate - Duration: 12:34"
- ✅ "Wife ended debate - Duration: 08:45"

**Both Active:**
- ⚠️ "Both are now debating!" (orange toast, larger size)
- High priority notification
- Requires interaction on browser notifications

**Time-Based Milestones:**
- ⏰ 5 minutes: "Debate ongoing for 5 minutes"
- ⏰ 15 minutes: "Long debate alert: 15 minutes" (yellow)
- 🚨 30 minutes: "Extended debate: 30 minutes!" (red)
- Continues every 30 minutes thereafter

**Special Events:**
- 🏆 New Record: "Longest debate this month: 45:23"
- 🕊️ Peaceful Day: "No debates today"
- 🔥 Streak: "Daily streak: 3 days of debates"
- 💡 Tips: "Most debates happen around 2 PM"

**Summary Notifications:**
- 📊 Daily Summary (9 PM): "3 debates today (1h 23m total)"
- 📈 Weekly Report (Monday 9 AM): "Last week: 12 debates, 4h 15m total. Wife initiated 58%"

#### 🔊 Sound & Vibration System

**Sound Alerts:**
- Programmatically generated tones (no external files needed)
- Different frequencies for different events:
  - Debate start: 440Hz, 0.3s (gentle pop)
  - Debate end: 523Hz, 0.5s (success chime)
  - Both active: 587Hz, 0.4s (double beep)
  - 5min milestone: 659Hz, 0.5s (gentle bell)
  - 15min alert: 698Hz, 0.7s (alert tone)
  - 30min warning: 784Hz, 1.0s (warning sound)
  - New record: 880Hz, 1.2s (achievement)
- Volume control (0-100%)
- Test sound button in settings
- Respects quiet hours

**Vibration Patterns (Mobile):**
- Debate start: Single short pulse [100]
- Debate end: Single medium pulse [200]
- Both active: Double pulse [100, 50, 100]
- 5min: Very subtle [50]
- 15min: Medium alert [100, 50, 100]
- 30min: Strong alert [200, 100, 200, 100, 200]
- New record: Celebration pattern [100, 50, 100, 50, 200]

#### ⚙️ Notification Settings

**In-App Notifications:**
- ✓ Enable/disable in-app toasts
- ✓ Show notification badges
- ✓ Auto-dismiss duration (customizable)

**Browser/OS Notifications:**
- ✓ Enable/disable browser notifications
- ✓ Permission status indicator
- ✓ Notify when app is in background
- ✓ Show on lock screen (mobile)

**Sound Settings:**
- ✓ Enable/disable notification sounds
- ✓ Volume slider (0-100%)
- ✓ Test sound button

**Vibration (Mobile):**
- ✓ Enable/disable vibration alerts
- ✓ Intensity control (if supported)
- ✓ Test vibration button

**Time-Based Alerts:**
- ✓ 5-minute milestone
- ✓ 15-minute alert
- ✓ 30-minute warning
- ✓ Hourly reminders after 1 hour

**Summary Notifications:**
- ✓ Daily summary with custom time
- ✓ Weekly report with day/time selection
- ✓ Monthly insights

**Event Notifications:**
- ✓ Debate start/end
- ✓ Both partners active
- ✓ New records
- ✓ Peaceful day celebrations

**Quiet Hours:**
- ✓ Enable quiet mode
- ✓ Custom start/end times
- ✓ Mutes sounds and vibration during quiet hours
- ✓ Still shows visual notifications

### 3. **Calendar View & Analytics**

#### Interactive Calendar
- Full monthly calendar grid
- Color-coded activity heatmap (0-4 levels)
- Orange gradient intensity based on debate frequency
- Month navigation (previous/next)
- Quick jump to today
- Visual indicators for each partner (dots)

#### Daily Analytics Panel
Appears when clicking any date:

**Quick Stats:**
- Total debates count
- Total time spent debating

**Both Debating Time:**
- Displays overlap duration when both were simultaneously debating
- Highlighted with warning colors
- Calculated from actual session overlaps

**Partner Breakdown:**
- Husband: Sessions count + total time
- Wife: Sessions count + total time
- Color-coded cards with icons

**Time Distribution Bar:**
- Visual progress bar showing percentage split
- Animated reveal
- Color-coded (blue/pink)

**Session Timeline:**
- Chronological list of all sessions
- Start/end times
- Duration for each session
- Scrollable for many sessions
- Partner icons and colors

**Insights:**
- "Husband initiated more debates this day"
- "Wife initiated more debates this day"
- "Equal number of debates from both"
- "Over 30 minutes of total debate time"
- "High debate activity day 🔥"

### 4. **Session Management**

#### Data Tracking
- Persistent storage using localStorage
- Session ID, partner, start time, end time, duration
- Automatic date grouping
- Real-time updates

#### Overlap Calculation
New utility functions calculate:
- Individual session overlaps
- Total overlap time per day
- Detailed overlap periods with timestamps
- Session statistics (average, longest, shortest)

### 5. **Service Worker Integration**

#### Background Functionality
- Registered service worker for persistent notifications
- Works even when app is closed
- Push notification support
- Click handling to bring app to foreground
- Automatic updates checking

---

## 🛠️ Technical Implementation

### Architecture
```
src/
├── components/
│   ├── NotificationSettings.tsx       # Settings modal UI
│   ├── NotificationPermissionModal.tsx # Permission request UI
│   ├── CalendarView.tsx               # Enhanced with overlap calc
│   ├── Header.tsx                     # Updated with settings button
│   └── ... (existing components)
│
├── hooks/
│   ├── useEnhancedNotifications.ts    # Main notification hook
│   ├── useNotifications.ts            # Legacy (backward compatible)
│   └── useDebateTracker.ts            # Session tracking
│
├── lib/
│   ├── NotificationManager.ts         # Core notification logic
│   ├── SoundPlayer.ts                 # Audio generation & playback
│   ├── sessionUtils.ts                # Overlap calculations
│   └── serviceWorkerRegistration.ts   # SW utilities
│
├── pages/
│   ├── Index.tsx                      # Original page
│   └── IndexEnhanced.tsx              # Enhanced version with all features
│
├── types/
│   └── debate.ts                      # TypeScript definitions
│
└── public/
    └── service-worker.js              # Background notification worker
```

### Key Technologies
- **React 18.3** - UI library
- **TypeScript 5.8** - Type safety
- **Framer Motion 12.24** - Animations
- **date-fns 3.6** - Date manipulation
- **Sonner** - Toast notifications (base)
- **Web Audio API** - Sound generation
- **Notification API** - Browser notifications
- **Service Worker API** - Background tasks
- **Vibration API** - Mobile haptic feedback

### State Management
- React hooks for local state
- localStorage for persistence
- NotificationManager class for centralized logic
- Settings synced to localStorage

---

## 📊 Data Flow

### Notification Flow
```
User Action (Toggle)
  → useDebateTracker (track session)
  → useEnhancedNotifications (notify)
  → NotificationManager (process)
  ├─ In-app: Toast queue → ToastContainer → Display
  ├─ Browser: Notification API → OS notification
  ├─ Sound: SoundPlayer → Web Audio API → Speaker
  └─ Vibration: Vibration API → Device motor
```

### Settings Flow
```
NotificationSettings Component
  → updateSettings()
  → useEnhancedNotifications
  → localStorage.setItem()
  → NotificationManager.updateSettings()
  → Applied to all future notifications
```

### Overlap Calculation Flow
```
Sessions array
  → groupSessionsByDate()
  → filter by partner
  → calculateTotalOverlapTime()
    → For each husband session:
      → For each wife session:
        → Check time overlap
        → Sum overlapping seconds
  → Display in CalendarView
```

---

## 🎨 UI/UX Features

### Visual Design
- **Color Scheme:**
  - Husband: Blue (#3b82f6)
  - Wife: Pink (#ec4899)
  - Success: Green (#22c55e)
  - Warning: Orange (#f97316)
  - Error: Red (#ef4444)

- **Animations:**
  - Pulse effects on active toggles
  - Glow shadows
  - Toast slide-in/fade-out
  - Calendar transition effects
  - Progress bar animations

- **Responsive:**
  - Mobile-first design
  - Breakpoints for tablet and desktop
  - Touch-friendly button sizes
  - Accessible contrast ratios

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- High contrast mode compatible

---

## 🔐 Privacy & Permissions

### Browser Notifications
- **Permission States:**
  - `default`: Not yet asked → Show modal
  - `granted`: Allowed → Send notifications
  - `denied`: Blocked → Show helpful instructions

- **Permission Request Flow:**
  1. Modal appears after 3 seconds on first visit
  2. User clicks "Allow" or "Not Now"
  3. Browser shows native permission prompt
  4. Result stored, modal won't show again
  5. User can change in settings later

### Data Storage
- **localStorage Only:**
  - Session data
  - Notification settings
  - Permission state
- **No Server/Cloud:**
  - All data stays on device
  - No tracking or analytics
  - Privacy-focused design

---

## 🚀 Getting Started

### For End Users

1. **Open the app** in a modern browser
2. **Grant notification permission** when prompted (optional)
3. **Configure settings** via the gear icon
4. **Start tracking** by toggling husband/wife buttons
5. **View analytics** in the calendar view

### For Developers

1. **Use Enhanced Version:**
   ```tsx
   // Update App.tsx or main router
   import IndexEnhanced from './pages/IndexEnhanced';
   ```

2. **Customize Settings:**
   ```tsx
   const DEFAULT_SETTINGS: NotificationSettings = {
     inAppEnabled: true,
     browserEnabled: true,
     soundEnabled: true,
     volume: 0.8,
     quietHours: { enabled: true, start: '23:00', end: '07:00' },
     timeMilestones: [5, 15, 30],
     dailySummary: { enabled: true, time: '21:00' },
     weeklySummary: { enabled: true, day: 1, time: '09:00' },
   };
   ```

3. **Add New Notification Types:**
   ```tsx
   // In NotificationManager.ts
   notifyCustomEvent(message: string): void {
     this.notify(
       'custom_event',
       'Custom Title',
       message,
       {
         type: 'custom_event',
         priority: 'medium',
       }
     );
   }
   ```

---

## 🧪 Testing

### Browser Compatibility
- ✅ Chrome 90+ (full support)
- ✅ Firefox 88+ (full support)
- ✅ Safari 14+ (full support, iOS 15+ for notifications)
- ✅ Edge 90+ (full support)

### Mobile Support
- ✅ Android Chrome (notifications + vibration)
- ✅ iOS Safari (notifications in iOS 16.4+)
- ✅ Progressive Web App ready

### Features to Test
- [ ] Toggle on/off for both partners
- [ ] Simultaneous debates
- [ ] Toast notifications appear and dismiss
- [ ] Browser notifications (background)
- [ ] Sound playback at various volumes
- [ ] Vibration on mobile devices
- [ ] Quiet hours functionality
- [ ] Settings persistence
- [ ] Calendar view with overlap display
- [ ] Milestone notifications at 5, 15, 30 minutes
- [ ] Permission request flow
- [ ] Service worker registration

---

## 📝 Future Enhancements

### Potential Features
- Export data to CSV/JSON
- Data visualization charts (trends over time)
- Custom partner names instead of "Husband/Wife"
- Debate topics/tags
- Win/loss tracking
- Multi-language support
- Dark/light mode toggle
- Debate resolution notes
- Conflict resolution tips
- Integration with calendar apps

### Technical Improvements
- Server-side sync (optional)
- Real-time sync between devices
- Advanced analytics with ML
- Voice-activated toggles
- Smart watch integration
- Browser extension

---

## 🐛 Known Limitations

1. **Browser Notifications on iOS:**
   - Requires iOS 16.4+ and Safari
   - Must add to Home Screen for full functionality

2. **Vibration API:**
   - Not supported on all devices
   - Desktop browsers don't vibrate

3. **Service Worker:**
   - Requires HTTPS in production
   - Not available in private browsing

4. **Sound Generation:**
   - Basic tones only (no complex audio)
   - Web Audio API required

---

## 📄 License

MIT License - Feel free to use and modify for personal or commercial projects.

---

## 👥 Credits

Built with ❤️ for couples who debate but still love each other.

**Technologies:**
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- date-fns
- Radix UI
- shadcn/ui components

---

## 📞 Support

For issues, questions, or feature requests:
1. Check this documentation
2. Review the code comments
3. Test in different browsers
4. Open an issue on GitHub (if applicable)

---

**Last Updated:** 2026-01-08
**Version:** 3.0.0
