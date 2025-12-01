import React, { useState } from 'react';
import { UserButton } from '@clerk/clerk-react';
import Inventory from './components/manager/Inventory';
import Menu from './components/manager/Menu';
import Employees from './components/manager/Employees';
import OrderingTrends from './components/manager/OrderingTrends';
import OperationalReports from './components/manager/OperationalReports';
import ZReport from './components/manager/ZReport';

/**
 * Manager Dashboard
 * Full access to inventory, menu, employees, and reports
 */
export default function Manager() {
  const [activeTab, setActiveTab] = useState('inventory');

  const tabs = [
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'menu', name: 'Menu', icon: '🍽️' },
    { id: 'employees', name: 'Employees', icon: '👥' },
    { id: 'trends', name: 'Ordering Trends', icon: '📈' },
    { id: 'reports', name: 'Operational Reports', icon: '📊' },
    { id: 'zreport', name: 'Z-Report (End of Day)', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manager Dashboard</h1>
              <p className="text-purple-100 mt-1">Kung Fu Tea - Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-purple-700 rounded-lg">
                <span className="font-semibold">Manager</span>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'menu' && <Menu />}
        {activeTab === 'employees' && <Employees />}
        {activeTab === 'trends' && <OrderingTrends />}
        {activeTab === 'reports' && <OperationalReports />}
        {activeTab === 'zreport' && <ZReport />}
      </main>
    </div>
  );
}
