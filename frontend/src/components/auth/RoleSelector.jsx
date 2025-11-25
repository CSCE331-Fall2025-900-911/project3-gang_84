import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Landing page that allows users to choose their role
 * Customer: No login required, direct access
 * Cashier/Manager: Requires authentication
 */
export default function RoleSelector() {
  return (
    <div className="min-h-screen bg-lime-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to Kung Fu Tea Kiosk
          </h1>
          <p className="text-xl text-gray-600">
            Select your access level to continue
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Customer Card */}
          <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Customer</h2>
              <p className="text-gray-600 mb-6">
                Browse menu and place orders
              </p>
              <Link
                to="/customer"
                className="block w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                Start Ordering
              </Link>
              <p className="text-sm text-gray-500 mt-3">No login required</p>
            </div>
          </div>

          {/* Cashier Card */}
          <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Cashier</h2>
              <p className="text-gray-600 mb-6">
                Process orders and payments
              </p>
              <Link
                to="/auth/cashier"
                className="block w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                Cashier Login
              </Link>
              <p className="text-sm text-gray-500 mt-3">Authentication required</p>
            </div>
          </div>

          {/* Manager Card */}
          <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Manager</h2>
              <p className="text-gray-600 mb-6">
                Full system access and reports
              </p>
              <Link
                to="/auth/manager"
                className="block w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                Manager Login
              </Link>
              <p className="text-sm text-gray-500 mt-3">Authentication required</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}
