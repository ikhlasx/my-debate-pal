# 🚀 Quick Deploy Checklist

Use this checklist to deploy your app to Vercel in under 10 minutes!

---

## Pre-Deployment (5 minutes)

### Step 1: Enable Enhanced Features ⚡

Choose ONE option:

**Option A: Update Router (Recommended)**
```bash
# Edit src/App.tsx or your main routing file
# Change: import Index from "@/pages/Index";
# To:     import Index from "@/pages/IndexEnhanced";
```

**Option B: Rename Files**
```bash
# In Git Bash or terminal
mv src/pages/Index.tsx src/pages/IndexOriginal.tsx
mv src/pages/IndexEnhanced.tsx src/pages/Index.tsx
```

- [ ] Enhanced features enabled

---

### Step 2: Test Locally

```bash
# Install dependencies (if not already done)
npm install

# Build the app
npm run build

# Preview the build
npm run preview
```

- [ ] Build succeeds without errors
- [ ] Preview works at http://localhost:4173
- [ ] App loads correctly
- [ ] No console errors

---

### Step 3: Commit Your Changes

```bash
# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Enable enhanced features and prepare for deployment"

# Push to GitHub (or GitLab/Bitbucket)
git push origin main
```

- [ ] Code committed
- [ ] Code pushed to remote repository

---

## Deploy to Vercel (3 minutes)

### Step 4: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Find **"my-debate-pal"** repository
4. Click **"Import"**

- [ ] Project imported to Vercel

---

### Step 5: Configure Build Settings

Vercel should auto-detect everything. Verify:

- **Framework Preset:** Vite ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install` ✅

Leave everything as default and click **"Deploy"**

- [ ] Build settings confirmed
- [ ] Deployment started

---

### Step 6: Wait for Deployment

⏱️ Takes 1-2 minutes

Watch the build logs:
- Installing dependencies...
- Building application...
- Deployment ready!

- [ ] Deployment successful
- [ ] URL received (e.g., `https://my-debate-pal.vercel.app`)

---

## Post-Deployment Testing (2 minutes)

### Step 7: Test Your Live App

Open your Vercel URL and test:

**Basic Functionality:**
- [ ] App loads successfully
- [ ] Husband toggle works
- [ ] Wife toggle works
- [ ] Timers display correctly
- [ ] Calendar opens

**Notification System:**
- [ ] Permission modal appears (after 3 seconds)
- [ ] Can grant notification permission
- [ ] Toast notifications show when toggling
- [ ] Settings icon opens settings modal
- [ ] Sound test button works

**Service Worker:**
- [ ] Open DevTools (F12)
- [ ] Go to Application → Service Workers
- [ ] See `service-worker.js` registered and active

---

### Step 8: Test on Mobile (Optional but Recommended)

- [ ] Open URL on phone
- [ ] Grant notification permission
- [ ] Test vibration (start a debate)
- [ ] Add to Home Screen
- [ ] Test as installed app

---

## Done! 🎉

Your app is now live at: `https://[your-project].vercel.app`

### What's Next?

**Automatic Deployments:**
- Every `git push` to main → auto-deploys
- Every push to other branches → creates preview URL

**Share Your App:**
```
Hey! Check out our debate tracker:
https://[your-project].vercel.app

Features:
✅ Real-time timers
✅ Push notifications
✅ Calendar analytics
✅ Sound & vibration alerts
```

---

## Quick Reference

### Redeploy
```bash
git add .
git commit -m "Update app"
git push
# Vercel auto-deploys in ~2 minutes
```

### View Logs
1. Go to Vercel Dashboard
2. Click your project
3. Click latest deployment
4. View build/runtime logs

### Rollback
1. Vercel Dashboard → Deployments
2. Find working deployment
3. Click "..." → "Promote to Production"

### Add Custom Domain
1. Vercel Dashboard → Settings → Domains
2. Add your domain
3. Configure DNS as shown
4. Wait 5-60 minutes for verification

---

## Troubleshooting

### Build Fails
```bash
# Test build locally first
npm run build

# Fix any errors shown
# Then commit and push again
```

### Service Worker Not Working
- Ensure URL starts with `https://` ✅ (Vercel provides this)
- Clear browser cache: DevTools → Application → Clear storage
- Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

### Notifications Not Working
- Check permission granted (address bar icon)
- Ensure not in incognito mode
- Verify HTTPS enabled
- Check browser supports notifications (Chrome, Firefox, Safari 14+)

---

## Support Resources

- **Full Deployment Guide:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Feature Documentation:** [FEATURES.md](FEATURES.md)
- **Implementation Guide:** [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)

---

**Deployment Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

Update this as you go! Good luck! 🚀
