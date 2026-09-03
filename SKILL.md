---
name: deployment
description: Standard deployment procedure for Rajugari Ventures application on VPS via Git and PM2.
---

# VPS Deployment Workflow

This document outlines the standard deployment procedure for the Rajugari Ventures application on the **VPS server**.

## Key Principles

1. **Local Build & Push**: We build the Vite production assets locally (`npm run build`) and commit them along with code changes.
2. **Push to Git**: All updates are pushed to the GitHub repository on branch `main`.
3. **Deploy on VPS via SSH**: Pull the latest changes into `/var/www/rajugariventures` and restart PM2.

---

## Step-by-Step VPS Deployment Process

### 1. Build & Push (Local Machine)
```bash
npm run build
git add .
git commit -m "Your commit message"
git push origin main
```

### 2. Update on VPS Server (SSH)
Run this single command block in your VPS terminal:

```bash
cd /var/www/rajugariventures
git pull origin main
npm install --legacy-peer-deps
pm2 restart rajugariventures
```

---

## Server Environment Reference
- **Server Deployment Path**: `/var/www/rajugariventures`
- **PM2 App Name**: `rajugariventures` (ID: 8)
- **Database Location**: MySQL / `/var/www/rajugariventures/rajugari.db`
- **Persistent Storage**: `/var/www/rajugariventures/persistent_storage`
