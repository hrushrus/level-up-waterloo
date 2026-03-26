# LevelUp Waterloo - Render Deployment Guide

This guide walks you through deploying your LevelUp Waterloo app to Render.com with both frontend and backend.

## Prerequisites

Before you start, make sure you have:

- ✅ A GitHub account (free at https://github.com)
- ✅ Your project pushed to GitHub
- ✅ A Render account (free at https://render.com)
- ✅ The `render.yaml` file in your project root (already created)

---

## Step 1: Push Your Project to GitHub

### 1.1 Create a GitHub Repository

1. Go to https://github.com/new
2. Name your repository: `levelup-waterloo`
3. Add description: "Mobile app for discovering volunteering opportunities in Waterloo region"
4. Choose **Public** (easier for deployment)
5. Click "Create repository"

### 1.2 Push Your Code to GitHub

In your terminal, run:

```bash
cd /home/ubuntu/waterloo-student-opps

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: LevelUp Waterloo app with volunteering opportunities"

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/levelup-waterloo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username.**

### 1.3 Verify on GitHub

1. Go to https://github.com/YOUR_USERNAME/levelup-waterloo
2. You should see all your files
3. You should see the `render.yaml` file in the root directory

---

## Step 2: Create a Render Account

1. Go to https://render.com
2. Click "Sign up"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your GitHub account
5. Complete your profile setup

---

## Step 3: Deploy Your Project

### 3.1 Create a Blueprint

1. Log in to https://render.com
2. Click "New +" button in the top right
3. Select "Blueprint"
4. Click "Connect Repository"
5. Find and select your `levelup-waterloo` repository
6. Click "Connect"

### 3.2 Configure Deployment

Render will automatically read your `render.yaml` file and show:

```
Services to deploy:
✓ levelup-waterloo-web (Frontend)
✓ levelup-api (Backend)
✓ levelup-db (Database)
```

1. Review the configuration
2. Click "Deploy Blueprint"
3. Wait for deployment to complete (5-15 minutes)

### 3.3 Monitor Deployment

You'll see a deployment dashboard showing:

- **Build logs** - Shows the build process
- **Status** - Building → Deploying → Live
- **Service URLs** - Your app URLs once deployed

---

## Step 4: Get Your URLs

Once deployment is complete, you'll have three URLs:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://levelup-waterloo-web.render.com` | Your web app |
| **Backend** | `https://levelup-api.render.com` | Your API server |
| **Database** | Auto-managed | PostgreSQL database |

### 4.1 Test Your Frontend

1. Open `https://levelup-waterloo-web.render.com` in your browser
2. You should see the LevelUp Waterloo app
3. Try searching and filtering opportunities

### 4.2 Test Your Backend API

1. Open `https://levelup-api.render.com/trpc/opportunities.list` in your browser
2. You should see a JSON response with opportunities

---

## Step 5: Configure Environment Variables

### 5.1 Update Frontend Environment

1. In Render dashboard, go to **levelup-waterloo-web** service
2. Click "Environment" tab
3. Verify these variables are set:
   ```
   NODE_ENV = production
   VITE_API_URL = https://levelup-api.render.com
   EXPO_PORT = 3000
   ```

### 5.2 Update Backend Environment

1. In Render dashboard, go to **levelup-api** service
2. Click "Environment" tab
3. Verify these variables are set:
   ```
   NODE_ENV = production
   DATABASE_URL = (auto-filled from database)
   PORT = 3000
   ```

### 5.3 Update Database Connection

The database connection is automatically configured, but verify:

1. In Render dashboard, go to **levelup-db** service
2. Click "Info" tab
3. You should see connection details

---

## Step 6: Verify Everything Works

### 6.1 Test Search Functionality

1. Open your frontend: `https://levelup-waterloo-web.render.com`
2. Try searching for "volunteer"
3. Results should appear from your database

### 6.2 Test Bookmarks

1. Click the heart icon on an opportunity
2. Go to the "Saved" tab
3. Your bookmark should appear

### 6.3 Test Filters

1. Try filtering by category, level, type, duration
2. Results should update correctly

### 6.4 Check Backend Logs

1. In Render dashboard, go to **levelup-api** service
2. Click "Logs" tab
3. You should see requests coming in
4. No errors should appear

---

## Step 7: Share Your App

Your app is now live! Share it with:

- **Friends**: `https://levelup-waterloo-web.render.com`
- **Teachers**: Share the link in class
- **School**: Post on school website
- **Social media**: Share the link

---

## Troubleshooting

### Issue: Build Failed

**Error message:** `Build failed - see logs for details`

**Solution:**
1. Click "Logs" tab
2. Look for the error message
3. Common issues:
   - Missing dependencies: Run `pnpm install` locally and commit
   - Wrong Node version: Check `package.json` for Node version
   - Environment variables: Make sure all required vars are set

### Issue: App Shows Blank Page

**Error message:** White screen or 404 error

**Solution:**
1. Check frontend logs: Go to **levelup-waterloo-web** → Logs
2. Check browser console: Right-click → Inspect → Console tab
3. Common issues:
   - API URL wrong: Check `VITE_API_URL` environment variable
   - Frontend build failed: Check build logs

### Issue: API Returns 500 Error

**Error message:** `Internal Server Error` or `500 Error`

**Solution:**
1. Check backend logs: Go to **levelup-api** → Logs
2. Common issues:
   - Database connection failed: Check `DATABASE_URL`
   - Missing environment variables: Verify all vars are set
   - Database migrations not run: See "Run Database Migrations" below

### Issue: Database Connection Failed

**Error message:** `Error: connect ECONNREFUSED` or `FATAL: role does not exist`

**Solution:**
1. Go to **levelup-db** service
2. Check if database is running (should say "Live")
3. Wait a few minutes for database to initialize
4. Restart the backend service: Click "Manual Deploy" button

### Issue: Free Tier Services Keep Sleeping

**Problem:** App is slow or unresponsive

**Solution:**
1. Upgrade to Starter plan ($7/month)
2. Or keep free tier and accept 30-second cold starts

---

## Run Database Migrations

If you need to run database migrations:

1. In Render dashboard, go to **levelup-api** service
2. Click "Shell" tab
3. Run:
   ```bash
   pnpm db:push
   ```

---

## Automatic Deployments

Every time you push to GitHub, Render automatically:

1. Detects the change
2. Rebuilds your services
3. Deploys the new version
4. Your app updates automatically

No manual deployment needed!

---

## Upgrade to Paid Plans

### When to Upgrade

- **Free tier**: Good for development and testing
- **Starter ($7/month)**: When you want always-on services
- **Standard ($12/month)**: When you get real users

### How to Upgrade

1. In Render dashboard, go to any service
2. Click "Settings" tab
3. Click "Change Plan"
4. Select your new plan
5. Confirm payment

---

## Monitor Your App

### View Logs

1. Go to any service
2. Click "Logs" tab
3. See real-time logs of your app

### View Metrics

1. Go to any service
2. Click "Metrics" tab
3. See CPU, memory, and network usage

### Set Up Alerts

1. Go to any service
2. Click "Alerts" tab
3. Get notified if service goes down

---

## Next Steps

After deployment:

1. **Share your app** with friends and teachers
2. **Collect feedback** on features and improvements
3. **Add more opportunities** to your database
4. **Monitor performance** using Render logs
5. **Plan new features** based on user feedback

---

## Support

If you run into issues:

1. **Check logs** - Most issues are visible in logs
2. **Render docs** - https://render.com/docs
3. **Ask for help** - Share logs and error messages

---

## Summary

You now have:

✅ Frontend deployed at `https://levelup-waterloo-web.render.com`
✅ Backend API deployed at `https://levelup-api.render.com`
✅ Database automatically managed
✅ Automatic deployments on GitHub push
✅ Free tier (upgradeable to $7/month)

Your LevelUp Waterloo app is live and ready to use!
