# Clerk Authentication Setup Guide

## Overview
This application uses Clerk for authentication with role-based access control:
- **Customer**: No authentication required, direct access to kiosk
- **Cashier**: Requires login, can process orders
- **Manager**: Requires login, full system access

## Setup Steps

### 1. Create a Clerk Account
1. Go to https://clerk.com/
2. Sign up for a free account
3. Create a new application

### 2. Get Your Publishable Key
1. In Clerk Dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_`)
3. Update `frontend/.env.local`:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

### 3. Configure User Metadata
Clerk uses metadata to store user roles. You need to set this up:

1. In Clerk Dashboard, go to **Users**
2. Click on a user or create a test user
3. Go to **Metadata** tab
4. Add to **Public metadata**:
   ```json
   {
     "role": "manager"
   }
   ```
   Or for cashiers:
   ```json
   {
     "role": "cashier"
   }
   ```

### 4. Create Test Users

#### Manager Account:
- Email: manager@example.com
- Role: `manager` (in public metadata)
- Access: Full system, inventory, reports

#### Cashier Account:
- Email: cashier@example.com
- Role: `cashier` (in public metadata)
- Access: Order processing only

### 5. Configure Sign-In Options

In Clerk Dashboard → **User & Authentication** → **Email, Phone, Username**:
- Enable **Email address** ✅
- Enable **Password** ✅
- Optional: Enable **Social logins** (Google, Microsoft, etc.)

### 6. Update Allowed Redirect URLs

In Clerk Dashboard → **Paths**:

Add these URLs:
```
http://localhost:5173/customer
http://localhost:5173/cashier
http://localhost:5173/manager
https://csce331-fall2025-900-911.github.io/project3-gang_84/customer
https://csce331-fall2025-900-911.github.io/project3-gang_84/cashier
https://csce331-fall2025-900-911.github.io/project3-gang_84/manager
```

### 7. Configure Sign-Out URLs

Add:
```
http://localhost:5173/
https://csce331-fall2025-900-911.github.io/project3-gang_84/
```

## User Flow

### Customer Flow (No Auth):
```
/ (Landing) → Click "Start Ordering" → /customer (Kiosk)
```

### Cashier Flow (Auth Required):
```
/ (Landing) → Click "Cashier Login" → /auth/cashier → Login → /cashier (Kiosk)
```

### Manager Flow (Auth Required):
```
/ (Landing) → Click "Manager Login" → /auth/manager → Login → /manager (Kiosk)
```

## Role Assignment Methods

### Method 1: Manual (via Dashboard)
1. Clerk Dashboard → Users
2. Click user → Metadata tab
3. Add to Public metadata: `{"role": "manager"}`

### Method 2: Automatic (via Sign-up form)
You can customize the sign-up form to include role selection:
1. Clerk Dashboard → User & Authentication → Email, Phone, Username
2. Add custom field: `role`
3. Use a dropdown with options: customer, cashier, manager

### Method 3: Programmatic (via API)
Update user metadata after sign-up:
```javascript
import { useUser } from '@clerk/clerk-react';

const { user } = useUser();
await user.update({
  publicMetadata: { role: 'manager' }
});
```

## Testing Locally

1. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Visit**: http://localhost:5173/

3. **Test each role**:
   - Customer: Click "Start Ordering" (no login)
   - Cashier: Click "Cashier Login" → Sign in with cashier account
   - Manager: Click "Manager Login" → Sign in with manager account

## Production Deployment

### Update Environment Variables

1. **GitHub Pages** (Frontend):
   - Go to repository → Settings → Secrets and variables → Actions
   - Add secret: `VITE_CLERK_PUBLISHABLE_KEY`
   - Value: Your production Clerk key

2. **Update workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   - name: Build frontend
     run: npm run build
     env:
       VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
       VITE_API_URL: https://project3-gang-84-c2is.onrender.com
   ```

3. **Render** (Backend):
   - No changes needed - backend doesn't handle auth

## Security Notes

1. **Never commit** `.env.local` or any file with keys
2. **Public metadata** is visible to all users (safe for roles)
3. **Private metadata** is only visible to the user and backend
4. Use **session claims** for sensitive authorization logic

## Customization

### Change Login Page Appearance

Update `ManagerLogin.jsx` or `CashierLogin.jsx`:
```jsx
<SignIn 
  appearance={{
    elements: {
      rootBox: "w-full",
      card: "shadow-none",
      formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
      formFieldInput: "border-2 border-gray-300",
    }
  }}
/>
```

### Add More Roles

1. Create new login component (e.g., `AdminLogin.jsx`)
2. Add route in `main.jsx`
3. Update `RoleGuard.jsx` to handle new role
4. Assign role in Clerk metadata: `{"role": "admin"}`

## Troubleshooting

### "Missing Clerk Publishable Key"
- Check `.env.local` exists and has correct key
- Restart dev server after adding env vars

### "Access Denied" error
- Check user's public metadata has correct role
- Verify role matches route's `requiredRole`

### User can't sign in
- Check Clerk Dashboard → Users → Sign-in methods enabled
- Verify redirect URLs are configured

### Changes not reflecting
- Clear browser cache
- Check for console errors (F12)
- Verify Clerk key is correct environment (test vs production)

## Resources

- Clerk Docs: https://clerk.com/docs
- React Integration: https://clerk.com/docs/quickstarts/react
- Metadata Guide: https://clerk.com/docs/users/metadata
- Role-based Access: https://clerk.com/docs/organizations/roles-permissions
