# GitHub Pages Deployment Guide

## Overview
This guide explains how to deploy the Kiosk frontend application to GitHub Pages using GitHub Actions.

## Prerequisites

1. ✅ Repository on GitHub: `CSCE331-Fall2025-900-911/project3-gang_84`
2. ✅ GitHub Pages enabled in repository settings
3. ✅ Workflow file created at `.github/workflows/deploy.yml`

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - Source: **GitHub Actions**
4. Click **Save**

### 2. Configure Repository Settings

The workflow is already configured to:
- ✅ Build the Vite React app from `/frontend`
- ✅ Set the correct base path (`/project3-gang_84/`)
- ✅ Deploy the `dist` folder to GitHub Pages

### 3. Trigger Deployment

The workflow will automatically run when:
- You push commits to the `main` branch
- You manually trigger it from the **Actions** tab

**To manually trigger:**
1. Go to **Actions** tab in your repository
2. Click **Deploy Vite app to Pages** workflow
3. Click **Run workflow** → **Run workflow**

### 4. Access Your Deployed Site

Once deployment completes (usually 1-2 minutes), your site will be available at:

```
https://csce331-fall2025-900-911.github.io/project3-gang_84/
```

## Important Notes

### API Endpoint Configuration

⚠️ **The frontend currently calls the backend at `http://localhost:3001/api/*`**

For production deployment, you need to either:

**Option 1: Update API URLs to use deployed backend**
```javascript
// In App.jsx and Weather.jsx, replace:
const response = await fetch('http://localhost:3001/api/menu');

// With your deployed backend URL:
const response = await fetch('https://your-backend-url.com/api/menu');
```

**Option 2: Use environment variables**

1. Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
```

2. Update fetch calls:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const response = await fetch(`${API_URL}/api/menu`);
```

3. Update `vite.config.js` to use env variables:
```javascript
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/project3-gang_84/' : '/',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  },
})
```

### Weather Feature

The weather feature requires:
- A backend server running at the configured API URL
- The backend must have CORS enabled for your GitHub Pages domain:
  ```javascript
  app.use(cors({
    origin: 'https://csce331-fall2025-900-911.github.io'
  }));
  ```

## Workflow Details

The GitHub Actions workflow does the following:

1. **Checkout code** from the repository
2. **Setup Node.js** v20 with npm caching
3. **Install dependencies** in the frontend folder
4. **Build the Vite app** (creates `frontend/dist`)
5. **Upload the dist folder** as a GitHub Pages artifact
6. **Deploy to GitHub Pages**

## Troubleshooting

### Build Fails

Check the **Actions** tab for error logs. Common issues:
- Missing dependencies: Ensure `package.json` is up to date
- Build errors: Test locally with `npm run build` in the frontend folder

### 404 on Deployment

- Ensure GitHub Pages source is set to **GitHub Actions** (not branch)
- Check that the base path in `vite.config.js` matches your repo name
- Wait a few minutes after first deployment

### Blank Page

- Check browser console for errors
- Verify the base path is correct (should be `/project3-gang_84/`)
- Ensure all assets are loading from the correct path

### API Calls Not Working

- Update API URLs to point to your deployed backend
- Configure CORS on the backend to allow your GitHub Pages domain
- Check browser Network tab for failed requests

## Local Testing

To test the production build locally:

```bash
cd frontend

# Build for production
npm run build

# Preview the build
npm run preview
```

Then visit `http://localhost:4173` to see the production build.

## File Structure

```
project3-gang_84/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── frontend/
│   ├── src/
│   ├── vite.config.js          # Base path configuration
│   ├── package.json
│   └── dist/                   # Built files (created by workflow)
└── backend/
    └── server.js               # Needs CORS configuration
```

## Next Steps

1. ✅ Commit and push the workflow file
2. ✅ Enable GitHub Pages in repository settings
3. ⏳ Wait for deployment to complete
4. 🌐 Access your site at the GitHub Pages URL
5. 🔧 Configure API endpoints for production
6. 🚀 Deploy backend to a hosting service (e.g., Render, Railway, AWS)

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
