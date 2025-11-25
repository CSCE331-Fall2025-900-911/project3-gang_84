import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

/**
 * Manager Login Page
 * Managers have full access to inventory, reports, and settings
 */
export default function ManagerLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Manager Login</h1>
          <p className="text-blue-100">Access inventory, reports, and system settings</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
              }
            }}
            routing="path"
            path="/auth/manager"
            signUpUrl="/auth/manager"
          />
        </div>

        <div className="mt-6 text-center">
          <Link to="/auth/cashier" className="text-white hover:text-blue-200 mr-4">
            Cashier Login
          </Link>
          <Link to="/" className="text-white hover:text-blue-200">
            Customer Mode
          </Link>
        </div>
      </div>
    </div>
  );
}
