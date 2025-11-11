# GitHub Pages Deployment - Quick Setup

## ✅ Files Created/Modified

1. **`.github/workflows/deploy.yml`** - GitHub Actions workflow for automated deployment
2. **`frontend/vite.config.js`** - Updated with correct base path for GitHub Pages
3. **`frontend/src/config/api.js`** - Centralized API configuration
4. **`frontend/src/App.jsx`** - Updated to use API configuration
5. **`frontend/src/components/Weather.jsx`** - Updated to use API configuration
6. **`DEPLOYMENT.md`** - Complete deployment documentation

## 🚀 Quick Start

### Step 1: Enable GitHub Pages
1. Go to repository **Settings** → **Pages**
2. Set Source to: **GitHub Actions**

### Step 2: Push Your Code
```bash
git add .
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

### Step 3: Monitor Deployment
- Go to **Actions** tab in your repository
- Watch the "Deploy Vite app to Pages" workflow
- Wait 1-2 minutes for completion

### Step 4: Access Your Site
Your site will be live at:
```
https://csce331-fall2025-900-911.github.io/project3-gang_84/
```

## ⚠️ Important: Backend Configuration

### Current State
- ✅ Frontend is configured for GitHub Pages
- ⚠️ Backend URL still points to `localhost:3001`
- ⏳ You need to deploy the backend separately

### To Deploy Backend

**Option 1: Update config after backend deployment**

After deploying your backend to a service (Railway, Render, etc.):

1. Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend-url.com
   ```

2. Commit and push:
   ```bash
   git add frontend/.env.production
   git commit -m "Add production backend URL"
   git push
   ```

**Option 2: Update api.js directly**

Edit `frontend/src/config/api.js`:
```javascript
if (import.meta.env.PROD) {
  return 'https://your-actual-backend-url.com';
}
```

### Backend CORS Configuration

Your backend **must** allow requests from GitHub Pages:

```javascript
// In backend/server.js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5175',
    'https://csce331-fall2025-900-911.github.io'
  ]
}));
```

## 📝 Testing Locally

Before deploying, test the production build:

```bash
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:4173` to see how it will look on GitHub Pages.

## 🔧 Troubleshooting

### Workflow Fails
- Check **Actions** tab for error logs
- Ensure `package.json` and `package-lock.json` are committed
- Try running `npm run build` locally first

### 404 Error
- Wait 2-3 minutes after first deployment
- Verify GitHub Pages source is set to **GitHub Actions**
- Check that base path in `vite.config.js` is correct

### Blank Page
- Open browser console (F12) for errors
- Verify API endpoint is accessible
- Check Network tab for failed requests

## 📦 What Happens on Deployment

1. GitHub Actions checks out your code
2. Installs Node.js and dependencies
3. Runs `npm run build` in the frontend folder
4. Uploads the `dist` folder
5. Deploys to GitHub Pages
6. Your site is live! 🎉

## 🎯 Next Steps

1. ✅ Push code with workflow file
2. ✅ Enable GitHub Pages in settings
3. ⏳ Wait for deployment
4. 🌐 Visit your live site
5. 🚀 Deploy backend to hosting service
6. 🔧 Update API URLs with production backend
7. 🎉 Fully functional production site!

## 📚 Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
