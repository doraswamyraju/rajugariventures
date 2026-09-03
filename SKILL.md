---
name: deployment
description: Standard deployment procedure for Rajugari Ventures application on pure VPS via Git and PM2.
---

# VPS Deployment Workflow

This document outlines the standard deployment procedure for the Rajugari Ventures application on the **VPS server** (`147.93.107.21`).

## Key Principles

1. **Local Build & Commit**: We always build the Vite production assets locally (`npm run build`) and commit `dist/` along with all code changes. The live VPS runs the pre-compiled bundle.
2. **Pure VPS Architecture**: We do not use cPanel. Deployment is handled directly through Git and PM2 over SSH.
3. **Continuous Deployment**: All changes pushed to `origin main` are pulled directly into the server directory `/var/www/rajugariventures`.

---

## Standard Deployment Process

### 1. Build & Push (Local Machine)
```bash
npm run build
git add .
git commit -m "Your descriptive commit message"
git push origin main
```

### 2. Pull & Restart (VPS Terminal via SSH)
Run this single command block in your server terminal:

```bash
cd /var/www/rajugariventures
git pull origin main
npm install --legacy-peer-deps
pm2 restart rajugariventures
```

---

## Server Environment Reference

- **Server Deployment Path**: `/var/www/rajugariventures`
- **PM2 App Name**: `rajugariventures` (Process ID: `8`)
- **Port**: `3000` (Reverse-proxied via Nginx)
- **Database**: MySQL / SQLite (`/var/www/rajugariventures/rajugari.db`)
- **Persistent Storage**: `/var/www/rajugariventures/persistent_storage`
- **Customer Pages**: `/var/www/rajugariventures/dist/` (e.g. `swarnaamahal_review.html`)

---

## Troubleshooting & Diagnostics

```bash
# Check PM2 processes
pm2 status

# View live real-time logs
pm2 logs rajugariventures

# Force restart with updated environment variables
pm2 restart rajugariventures --update-env
```
