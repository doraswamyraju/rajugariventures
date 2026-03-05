---
name: deployment
description: Standard deployment procedure for Rajugari Ventures application using cPanel Git Version Control.
---

# Deployment Workflow

This document outlines the standard deployment procedure for the Rajugari Ventures application. Follow these instructions carefully to ensure smooth deployments and avoid testing untested code in the live environment.

## Key Principles

1. **Local Development & Build Only**: cPanel does not have the capability to build the application (like running `vite build`). Therefore, we **ALWAYS** build the application in the local environment and commit the built assets.
2. **Never Test Locally**: We never test anything on the `localhost` development environment before pushing.
3. **Always Push to Git**: All changes must be pushed to the Git repository.
4. **Test Live**: We test the application live **AFTER** pulling the latest code into cPanel via Git Version Control.

## Step-by-Step Deployment Process

### 1. Build the Application Locally
Whenever you finish making changes to the application (both frontend and backend), you must build the Vite production assets locally.

```bash
npm run build
```
*(This generates the `dist/` folder containing the compiled static assets. Note: We have removed `dist/` from `.gitignore` so these built files can be tracked).*

### 2. Commit and Push to Git
Add all your changes, including the built `dist/` directory, and push them to your Git repository holding the code.

```bash
git add .
git commit -m "Build and update for deployment"
git push origin main
```

### 3. Deploy via cPanel Git Version Control
1. Log into your cPanel account.
2. Navigate to **Git Version Control**.
3. Select the repository configured for `rajugariventures.com`.
4. Click **Update from Remote** (or *Deploy HEAD Commit*) to pull the latest changes onto the live server.

### 4. Important Notes on cPanel Configuration
1. **Document Root / File Listings**: If you are seeing an `Index of /` with a list of files when visiting `rajugariventures.com`, it is because the root directory `public_html/` does not contain an `index.html` or the domain is not pointing to the `dist/` folder.
2. **Setup Node.js App**: Because this project uses an Express backend (`server.ts`) for APIs and the database (`rajugari.db`), you **cannot** just serve `dist/` as a static HTML website. You must configure a **Node.js App** in cPanel that points to the repository's root, installs `node_modules`, and runs the backend server (using `npx tsx server.ts` or a compiled JS equivalent).
3. If only the static site is needed, cPanel's Document Root for the domain should be updated to point directly to the `public_html/dist` folder (or wherever the repo is cloned, such as `/home/skillsak/repositories/rajugari-ventures/dist`).
