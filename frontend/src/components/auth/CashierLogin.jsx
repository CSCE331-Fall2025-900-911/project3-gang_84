import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

/**
 * Cashier Login Page
 * Cashiers can process orders but have limited access
 */
export default function CashierLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Cashier Login</h1>
          <p className="text-green-100">Process customer orders and payments</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
              }
            }}
            afterSignInUrl="/cashier"
            afterSignUpUrl="/cashier"
          />
        </div>

        <div className="mt-6 text-center">
          <Link to="/auth/manager" className="text-white hover:text-green-200 mr-4">
            Manager Login
          </Link>
          <Link to="/" className="text-white hover:text-green-200">
            Customer Mode
          </Link>
        </div>
      </div>
    </div>
  );
}
