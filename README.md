# Couple's Debate Tracker 💙💗

A playful web application that tracks debate sessions between partners, featuring real-time timers, dual-layer notifications, calendar analytics, and detailed insights.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

- **Dual Independent Timers** - Track debates for both partners simultaneously
- **Smart Notifications** - In-app toasts + browser/OS notifications
- **Sound & Vibration** - Customizable audio alerts and haptic feedback
- **Calendar Analytics** - View debate history with detailed insights
- **Overlap Tracking** - See when both partners were debating at the same time
- **Time Milestones** - Alerts at 5, 15, and 30 minutes
- **Daily/Weekly Summaries** - Automated reports of debate patterns
- **Quiet Hours** - Schedule notification-free periods
- **Service Worker** - Background notifications even when app is closed
- **Progressive Web App** - Install on mobile devices

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Modern browser (Chrome, Firefox, Safari 14+, Edge)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd my-debate-pal

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:8080` to see your app!

---

## 📦 Deploy to Vercel (Recommended)

### Quick Deploy (5 minutes)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Click "Deploy" (Vercel auto-detects Vite settings)
   - Done! 🎉

3. **Your app is live!**
   - URL: `https://your-project.vercel.app`
   - HTTPS enabled automatically
   - Service worker working
   - Notifications ready

### Detailed Instructions

See [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) for a step-by-step checklist
See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for comprehensive deployment guide

---

## 📖 Documentation

- **[FEATURES.md](FEATURES.md)** - Complete feature list and technical details
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Setup and customization guide
- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Deployment instructions
- **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)** - Quick deployment checklist

---

## 🎯 Usage

### Basic Usage

1. **Start a Debate**
   - Click the Husband or Wife toggle button
   - Timer starts counting
   - You'll see a toast notification

2. **End a Debate**
   - Click the active toggle again
   - Duration is saved
   - Session appears in history

3. **View Analytics**
   - Click the calendar icon
   - Select any date to see detailed stats
   - View overlap time when both were debating

4. **Configure Settings**
   - Click the gear icon
   - Customize notifications, sounds, and quiet hours
   - Test sound and vibration

### Enable All Features

The app has two versions. To use the full-featured version:

**Update your routing file** (e.g., `src/App.tsx`):

```tsx
// Change this:
import Index from "@/pages/Index";

// To this:
import Index from "@/pages/IndexEnhanced";
```

Or rename the files:
```bash
mv src/pages/IndexEnhanced.tsx src/pages/Index.tsx
```

---

## 🛠️ Technologies

### Core
- **React 18.3** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool
- **Tailwind CSS 3.4** - Styling

### UI Components
- **shadcn/ui** - Component library
- **Radix UI** - Headless components
- **Framer Motion 12.24** - Animations
- **Lucide React** - Icons

### Features
- **date-fns 3.6** - Date manipulation
- **Web Audio API** - Sound generation
- **Notification API** - Browser notifications
- **Service Worker API** - Background functionality
- **Vibration API** - Haptic feedback

---

## 🎨 Customization

### Change Notification Sounds

Edit `src/lib/SoundPlayer.ts`:
```typescript
const soundDefinitions = {
  'debate_start': { frequency: 440, duration: 0.3, type: 'sine' },
  // Add your custom sounds here
};
```

### Adjust Default Settings

Edit `src/hooks/useEnhancedNotifications.ts`:
```typescript
const DEFAULT_SETTINGS = {
  volume: 0.8,
  quietHours: { start: '23:00', end: '07:00' },
  timeMilestones: [5, 15, 30],
  // Customize as needed
};
```

### Add Custom Partner Names

Currently uses "Husband" and "Wife". To customize, update references in:
- `src/components/DebateToggle.tsx`
- `src/types/debate.ts`
- Notification messages

---

## 📱 Mobile Installation (PWA)

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home Screen"
4. Tap "Add"

Now you can use it like a native app! 📲

---

## 🔒 Privacy

- ✅ All data stored locally (localStorage)
- ✅ No server communication
- ✅ No tracking or analytics
- ✅ No third-party services
- ✅ Open source - audit the code yourself

---

## 🧪 Testing

### Test Locally
```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

### Test Features
- [ ] Toggle buttons work
- [ ] Timers count correctly
- [ ] Notifications appear
- [ ] Sounds play
- [ ] Calendar shows data
- [ ] Settings persist
- [ ] Service worker registers

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+ (iOS 16.4+ for notifications)
- ✅ Edge 90+

---

## 🐛 Troubleshooting

### Notifications Not Working
- Ensure HTTPS is enabled (required for service workers)
- Check permission status in browser address bar
- Verify service worker is registered (DevTools → Application)
- Not supported in incognito/private mode

### Service Worker Issues
- Requires HTTPS in production (Vercel provides this automatically)
- Clear cache: DevTools → Application → Clear Storage
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Build Fails
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run lint

# Fix errors and try again
```

---

## 🤝 Contributing

This is a personal project, but feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - Feel free to use and modify for personal or commercial projects.

---

## 🙏 Acknowledgments

Built with ❤️ for couples who debate but still love each other.

**Special Thanks:**
- shadcn for the amazing UI components
- Vercel for easy deployment
- The React team for an excellent framework

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Questions**: Check the [documentation](FEATURES.md)
- **Feature Requests**: Create an issue with the "enhancement" label

---

## 🗺️ Roadmap

Potential future features:
- [ ] Export data to CSV/JSON
- [ ] Custom partner names
- [ ] Debate topics/tags
- [ ] Data visualization charts
- [ ] Multi-language support
- [ ] Theme customization (dark/light mode)
- [ ] Cloud sync (optional)
- [ ] Conflict resolution tips

---

## 📊 Project Stats

- **Version**: 3.0.0
- **Last Updated**: January 2026
- **Lines of Code**: ~5,000+
- **Components**: 15+
- **Hooks**: 3 custom hooks
- **Build Size**: ~200KB (minified + gzipped)

---

**Made with 💙 and 💗**

Deploy your own: [vercel.com](https://vercel.com)

---

## Alternative Deployment Options

While Vercel is recommended, you can also deploy to:

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "gh-pages -d dist"

# Deploy
npm run build
npm run deploy
```

### Railway
1. Connect your GitHub repo
2. Railway auto-detects Vite
3. Deploys automatically

### Render
1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `dist`

---

**Current Status**: ✅ Production Ready

**Live Demo**: Deploy to see it in action!

**Questions?** Check the [documentation](FEATURES.md) or open an issue.
