import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

/**
 * Role-based access control hook
 * Checks user's role from Clerk metadata
 */
export function useUserRole() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded || !user) {
    return { role: null, isLoading: !isLoaded };
  }

  // Role is stored in user's public metadata
  const role = user.publicMetadata?.role || 'customer';
  
  return {
    role,
    isLoading: false,
    isManager: role === 'manager',
    isCashier: role === 'cashier',
    isCustomer: role === 'customer',
  };
}

/**
 * Protected route component that checks for authentication and role
 */
export function ProtectedRoute({ children, requiredRole }) {
  const { role, isLoading } = useUserRole();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    // Not authenticated - redirect using navigate for proper routing
    React.useEffect(() => {
      navigate('/auth/manager', { replace: true });
    }, [navigate]);
    return null;
  }

  if (requiredRole && role !== requiredRole) {
    // Wrong role
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            You don't have permission to access this page.
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}
