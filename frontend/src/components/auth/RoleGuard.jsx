import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

/**
 * Role-based access control hook
 * Checks user's roles from Clerk metadata
 * Supports both single role (string) and multiple roles (array)
 */
export function useUserRole() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return { roles: [], isLoading: true };
  }
  
  if (!user) {
    return { roles: [], isLoading: false, isAuthenticated: false };
  }

  // Roles can be stored as array or single string in user's public metadata
  const rolesData = user.publicMetadata?.roles || user.publicMetadata?.role;
  const roles = Array.isArray(rolesData) ? rolesData : (rolesData ? [rolesData] : []);
  
  // Helper function to check if user has a specific role
  const hasRole = (role) => roles.includes(role);
  
  return {
    roles,
    primaryRole: roles[0] || null,
    isLoading: false,
    isAuthenticated: true,
    hasRole,
    isManager: hasRole('manager'),
    isCashier: hasRole('cashier'),
    isCustomer: roles.length === 0 || hasRole('customer'), // Customer if no roles or has customer role
  };
}

/**
 * Protected route component that checks for authentication and role(s)
 * Supports single required role or array of acceptable roles
 */
export function ProtectedRoute({ children, requiredRole }) {
  const { roles, primaryRole, hasRole, isLoading, isAuthenticated } = useUserRole();
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

  // Not authenticated at all
  if (!isAuthenticated) {
    React.useEffect(() => {
      navigate('/auth/manager', { replace: true });
    }, [navigate]);
    return null;
  }

  // Authenticated but no roles assigned - show error
  if (requiredRole && roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">No Role Assigned</h2>
          <p className="text-gray-700 mb-4">
            Your account doesn't have any roles assigned yet. Please contact an administrator to assign you the appropriate role.
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Check if user has required role(s)
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      // User doesn't have any of the required roles
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-700 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Your roles: {roles.join(', ')}
            </p>
            <a href="/" className="text-blue-600 hover:underline">
              Return to Home
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}
