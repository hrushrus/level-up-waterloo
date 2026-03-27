# LevelUp Waterloo - Refactoring & Deployment Guide

This guide explains the refactored architecture and how to deploy both services.

## New Architecture

Your app has been refactored into **two independent services**:

```
level-up-waterloo/
├── frontend/           ← React web app (deploys to Vercel)
│   ├── app/
│   ├── components/
│   ├── package.json
│   ├── vercel.json
│   └── README.md
│
├── backend/            ← Express API (deploys to Render)
│   ├── server/
│   ├── drizzle/
│   ├── package.json
│   ├── render.yaml
│   └── README.md
│
└── REFACTORING_GUIDE.md (this file)
```

## Why This Refactoring?

✅ **Easier Deployment** - Each service deploys independently
✅ **Better Scalability** - Scale frontend and backend separately
✅ **Industry Standard** - Microservices architecture
✅ **Clearer Separation** - Frontend concerns vs backend concerns
✅ **Faster Deployments** - Only changed service redeploys

## Deployment Steps

### Step 1: Push Refactored Code to GitHub

```bash
cd /path/to/level-up-waterloo
git add .
git commit -m "Refactor: separate frontend and backend into independent services"
git push origin main
```

### Step 2: Deploy Backend to Render

#### 2.1 Create Render Account
- Go to https://render.com
- Sign up with GitHub
- Authorize Render to access your repositories

#### 2.2 Create Backend Service
1. Click **"New +"** → **"Web Service"**
2. Select your `level-up-waterloo` repository
3. Configure:
   - **Name**: `levelup-api`
   - **Root Directory**: `backend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `NODE_ENV=production node dist/index.js`
   - **Environment Variables**:
     ```
     NODE_ENV = production
     PORT = 3000
     DATABASE_URL = (your MySQL connection string)
     CORS_ORIGIN = https://levelup-waterloo.vercel.app
     ```
4. Click **"Create Web Service"**
5. Wait for deployment (5-10 minutes)

#### 2.3 Create PostgreSQL Database (Optional)
If you want to use Render's PostgreSQL instead of MySQL:

1. Click **"New +"** → **"PostgreSQL"**
2. Configure and create
3. Copy connection string
4. Add to backend environment variables as `DATABASE_URL`

**Note**: Your current schema uses MySQL. For PostgreSQL, you'd need to adapt the schema.

#### 2.4 Get Backend URL
Once deployed, you'll have a URL like:
```
https://levelup-api.render.com
```

### Step 3: Deploy Frontend to Vercel

#### 3.1 Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub
- Authorize Vercel to access your repositories

#### 3.2 Import Project
1. Click **"Add New"** → **"Project"**
2. Select your `level-up-waterloo` repository
3. Click **"Import"**

#### 3.3 Configure Frontend
1. **Project Name**: `levelup-waterloo-web`
2. **Framework Preset**: Other
3. **Root Directory**: `frontend`
4. **Build Command**: `pnpm install && pnpm build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   ```
   VITE_API_URL = https://levelup-api.render.com
   ```
7. Click **"Deploy"**

#### 3.4 Wait for Deployment
Vercel will build and deploy (2-5 minutes)

#### 3.5 Get Frontend URL
Once deployed, you'll have a URL like:
```
https://levelup-waterloo-web.vercel.app
```

### Step 4: Connect Frontend to Backend

If you haven't already, update the frontend environment variable:

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Update `VITE_API_URL`:
   ```
   VITE_API_URL = https://levelup-api.render.com
   ```
4. Redeploy (Vercel will automatically redeploy)

### Step 5: Test Your Deployment

1. Open your frontend URL: `https://levelup-waterloo-web.vercel.app`
2. Try searching for "volunteer"
3. Test bookmarking an opportunity
4. Try the filters

If everything works, you're done! 🎉

## Troubleshooting

### Backend Deployment Fails

**Error**: "Cannot find module"
- **Solution**: Make sure `backend/` directory has all files
- Check that `backend/shared/` and `backend/drizzle/` exist

**Error**: "Database connection failed"
- **Solution**: Check `DATABASE_URL` environment variable
- Ensure database is running and accessible

### Frontend Deployment Fails

**Error**: "Build failed"
- **Solution**: Check build logs in Vercel dashboard
- Ensure `VITE_API_URL` is set correctly
- Try clearing cache: Settings → Deployments → Clear Cache

**Error**: "Cannot GET /"
- **Solution**: Frontend build didn't complete
- Check that `frontend/` directory has all files
- Verify build command: `pnpm install && pnpm build`

### API Calls Fail

**Error**: "CORS error" or "Failed to fetch"
- **Solution**: Check `CORS_ORIGIN` in backend environment
- Should match your frontend URL exactly
- Restart backend service after changing

**Error**: "API returns 500"
- **Solution**: Check backend logs in Render dashboard
- Verify `DATABASE_URL` is correct
- Run migrations: `pnpm db:push`

## Local Development

### Run Both Services Locally

#### Terminal 1: Backend
```bash
cd backend
pnpm install
pnpm dev
```
Backend runs on `http://localhost:3000`

#### Terminal 2: Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
Frontend runs on `http://localhost:8081`

### Update Frontend API URL for Local Development

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:3000
```

## Updating Your App

### Update Backend

1. Make changes in `backend/` directory
2. Push to GitHub
3. Render automatically redeploys

### Update Frontend

1. Make changes in `frontend/` directory
2. Push to GitHub
3. Vercel automatically redeploys

### Update Both

1. Make changes in both directories
2. Push to GitHub
3. Both services redeploy independently

## Monitoring

### Backend Logs (Render)
1. Go to Render dashboard
2. Click your backend service
3. Click **"Logs"** tab
4. See real-time logs

### Frontend Logs (Vercel)
1. Go to Vercel dashboard
2. Click your frontend project
3. Click **"Deployments"**
4. Click a deployment to see logs

## Scaling

### Upgrade Backend (Render)
1. Go to backend service
2. Click **"Settings"**
3. Click **"Change Plan"**
4. Upgrade to Starter ($7/month) for always-on

### Upgrade Frontend (Vercel)
1. Go to Vercel dashboard
2. Click **"Settings"** → **"Billing"**
3. Upgrade plan if needed

## Next Steps

1. **Share your app** - Send the frontend URL to friends and teachers
2. **Monitor performance** - Check logs regularly
3. **Collect feedback** - Get user feedback on features
4. **Plan improvements** - Add new features based on feedback
5. **Scale as needed** - Upgrade plans when traffic increases

## Support

For issues:
1. Check the **Troubleshooting** section above
2. Review logs in Render/Vercel dashboards
3. Check `backend/README.md` and `frontend/README.md`

## Summary

You now have:
- ✅ Backend running on Render
- ✅ Frontend running on Vercel
- ✅ Both services connected via API
- ✅ Automatic deployments on GitHub push
- ✅ Scalable, maintainable architecture

Your app is live and ready to use! 🚀
