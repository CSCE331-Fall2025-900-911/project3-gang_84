import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import App from './App.jsx'
import RoleSelector from './components/auth/RoleSelector.jsx'
import ManagerLogin from './components/auth/ManagerLogin.jsx'
import CashierLogin from './components/auth/CashierLogin.jsx'
import { ProtectedRoute } from './components/auth/RoleGuard.jsx'
import './index.css'

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing Clerk Publishable Key. Set VITE_CLERK_PUBLISHABLE_KEY in your .env file')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY || ''}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Landing page - role selection */}
          <Route path="/" element={<RoleSelector />} />
          
          {/* Authentication routes */}
          <Route path="/auth/manager" element={<ManagerLogin />} />
          <Route path="/auth/cashier" element={<CashierLogin />} />
          
          {/* Customer route - no authentication required */}
          <Route path="/customer" element={<App role="customer" />} />
          
          {/* Cashier route - requires cashier authentication */}
          <Route 
            path="/cashier" 
            element={
              <ProtectedRoute requiredRole="cashier">
                <App role="cashier" />
              </ProtectedRoute>
            } 
          />
          
          {/* Manager route - requires manager authentication */}
          <Route 
            path="/manager" 
            element={
              <ProtectedRoute requiredRole="manager">
                <App role="manager" />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
)