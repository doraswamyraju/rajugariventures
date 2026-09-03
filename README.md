# Rajugari Ventures (rajugariventures.com)

Production web application & backend services for Rajugari Ventures.

---

## 🏗️ Architecture & Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, TSX, MySQL2 / SQLite fallback, Multer, JWT Auth, Google GenAI
- **Hosting / Infrastructure**: Dedicated Ubuntu VPS (Pure VPS setup — No cPanel)
- **Process Manager**: PM2 (`rajugariventures`)
- **Web Server / Reverse Proxy**: Nginx proxying to Node.js on port 3000

---

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
2. **Start Dev Server:**
   ```bash
   npm run dev
   ```
3. **Type Check & Lint:**
   ```bash
   npm run lint
   ```
4. **Build Production Bundle:**
   ```bash
   npm run build
   ```

---

## 🚀 Standard VPS Deployment Process

> [!IMPORTANT]
> **Key Rule**: Always build production assets locally (`npm run build`) before committing, because the VPS pulls the pre-built `dist/` folder directly to avoid heavy build operations on the live server.

### Step 1: Local Machine (Build & Push)
```bash
npm run build
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 2: VPS Server (SSH Terminal)
Connect to your VPS terminal and run:

```bash
cd /var/www/rajugariventures
git pull origin main
npm install --legacy-peer-deps
pm2 restart rajugariventures
```

---

## 📋 Server Reference & Diagnostics

| Property | Value |
| :--- | :--- |
| **Server Path** | `/var/www/rajugariventures` |
| **PM2 Process Name** | `rajugariventures` (Process ID: `8`) |
| **Persistent Storage** | `/var/www/rajugariventures/persistent_storage` |
| **Database** | MySQL (`skillsak_rajugariventures`) / SQLite (`rajugari.db`) |
| **Direct Review Landing Pages** | `public/` & `dist/` (e.g. `swarnaamahal_review.html`) |

### Useful VPS Commands:
```bash
# View live application logs
pm2 logs rajugariventures

# Check process status and memory
pm2 status

# Restart with environment reload
pm2 restart rajugariventures --update-env
```
