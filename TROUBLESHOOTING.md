# GitHub Pages Deployment Troubleshooting

## ✅ Latest Fix Applied

**Fixed `vite.config.js` base path:**
- ❌ Was: `'/project3-gang_84/frontend/'`
- ✅ Now: `'/project3-gang_84/'`

This was causing the site to look for assets in the wrong location.

## 🔍 Check Deployment Status

### Step 1: Check GitHub Actions
1. Go to: https://github.com/CSCE331-Fall2025-900-911/project3-gang_84/actions
2. Look for the "Deploy Vite app to Pages" workflow
3. Check if it's:
   - ✅ **Green checkmark**: Deployed successfully
   - 🟡 **Yellow dot**: Currently running (wait 2-3 minutes)
   - ❌ **Red X**: Failed (click to see error logs)

### Step 2: Check GitHub Pages Settings
1. Go to: https://github.com/CSCE331-Fall2025-900-911/project3-gang_84/settings/pages
2. Verify:
   - **Source**: Should be "GitHub Actions" (NOT "Deploy from a branch")
   - **Custom domain**: Should be empty
   - You should see: "Your site is live at https://csce331-fall2025-900-911.github.io/project3-gang_84/"

### Step 3: Check Your Site
Visit: https://csce331-fall2025-900-911.github.io/project3-gang_84/

## 🐛 Common Issues & Solutions

### Issue 1: Workflow Not Running
**Symptom**: No workflow appears in Actions tab

**Solution**:
```bash
# Make sure workflow file is committed
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow"
git push origin main
```

### Issue 2: Build Fails
**Symptom**: Red X in Actions tab

**Solution**:
1. Click on the failed workflow
2. Read the error message
3. Common errors:
   - **Missing package-lock.json**: Run `npm install` in frontend folder, commit the file
   - **Build errors**: Test locally with `npm run build` in frontend folder
   - **Node version**: Workflow uses Node 20, ensure compatibility

### Issue 3: 404 Error on Site
**Symptom**: GitHub Pages shows 404 page

**Solution**:
1. Wait 2-3 minutes after deployment completes
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Verify GitHub Pages source is "GitHub Actions"
4. Check that `vite.config.js` has correct base path

### Issue 4: Blank White Page
**Symptom**: Site loads but shows blank page

**Solution**:
1. Open browser console (F12 → Console tab)
2. Look for errors like:
   - "Failed to fetch module" → Wrong base path in vite.config.js
   - "CORS error" → Backend not configured for GitHub Pages
   - "404 for assets" → Check base path

**Fix**: The base path should be `/project3-gang_84/` (just fixed this!)

### Issue 5: Assets Not Loading
**Symptom**: Site loads but images/CSS missing

**Solution**:
Check that `vite.config.js` base path matches your repo name:
```javascript
base: '/project3-gang_84/',  // Must match repo name exactly
```

## 🧪 Test Locally First

Before pushing, test the production build locally:

```bash
cd frontend

# Build for production
npm run build

# Preview the build
npm run preview

# Should see: "http://localhost:4173"
```

Visit http://localhost:4173 and check:
- ✅ Site loads correctly
- ✅ All assets (CSS, images) load
- ✅ Navigation works
- ⚠️ API calls will fail (expected, needs backend)

## 📝 Deployment Checklist

After fixing vite.config.js, follow these steps:

### 1. Commit the Fix
```bash
git add frontend/vite.config.js
git commit -m "Fix GitHub Pages base path"
git push origin main
```

### 2. Watch the Deployment
1. Go to Actions tab: https://github.com/CSCE331-Fall2025-900-911/project3-gang_84/actions
2. Wait for workflow to complete (2-3 minutes)
3. Look for green checkmark

### 3. Verify Deployment
1. Visit: https://csce331-fall2025-900-911.github.io/project3-gang_84/
2. Check browser console for errors (F12)
3. Verify page loads correctly

### 4. Check API Errors (Expected)
The frontend will load, but you'll see API errors because:
- ❌ Backend is not deployed yet
- ❌ Still pointing to `localhost:3001`

This is normal! The frontend deployment is working, you just need to deploy the backend separately.

## 🔧 Manual Workflow Trigger

If automatic deployment doesn't work:

1. Go to: https://github.com/CSCE331-Fall2025-900-911/project3-gang_84/actions
2. Click "Deploy Vite app to Pages" workflow
3. Click "Run workflow" button
4. Select "main" branch
5. Click green "Run workflow" button

## 📊 Expected Results

### After Successful Deployment:

**What Works:**
- ✅ Site loads at GitHub Pages URL
- ✅ UI displays correctly
- ✅ Can see menu categories
- ✅ Can switch to weather tab
- ✅ Basic navigation works

**What Doesn't Work (Yet):**
- ❌ Menu items don't load (needs backend)
- ❌ Weather doesn't load (needs backend)
- ❌ Cart functionality (needs backend)

This is expected! You need to:
1. Deploy backend to a hosting service
2. Update `frontend/src/config/api.js` with backend URL
3. Redeploy frontend

## 🚀 Next Steps After Frontend Deploys

1. **Deploy Backend** to Railway/Render/AWS
2. **Update API Configuration**:
   ```javascript
   // In frontend/src/config/api.js
   if (import.meta.env.PROD) {
     return 'https://your-backend-url.com';
   }
   ```
3. **Configure CORS** in backend:
   ```javascript
   app.use(cors({
     origin: 'https://csce331-fall2025-900-911.github.io'
   }));
   ```
4. **Push and Redeploy**

## 📞 Still Not Working?

If after following all steps above, it still doesn't work:

1. **Share the error**: Take a screenshot of:
   - Actions tab showing the workflow status
   - Browser console errors (F12)
   - The error message from failed workflow (if red X)

2. **Check the workflow logs**:
   - Click on the failed/running workflow in Actions
   - Expand each step to see detailed logs
   - Look for error messages in red

3. **Verify file structure**:
   ```
   project3-gang_84/
   ├── .github/
   │   └── workflows/
   │       └── deploy.yml       ✅ Must exist
   └── frontend/
       ├── vite.config.js       ✅ Must have base: '/project3-gang_84/'
       ├── package.json         ✅ Must exist
       └── package-lock.json    ✅ Must exist (run npm install if missing)
   ```

## ✅ Summary

**You just fixed the base path issue!** Now:

```bash
# Commit and push the fix
git add frontend/vite.config.js
git commit -m "Fix vite base path for GitHub Pages"
git push origin main

# Wait 2-3 minutes, then visit:
# https://csce331-fall2025-900-911.github.io/project3-gang_84/
```

Your frontend should now deploy successfully! 🎉
