import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import Inventory from './components/manager/Inventory';
import Menu from './components/manager/Menu';
import Employees from './components/manager/Employees';
import OrderingTrends from './components/manager/OrderingTrends';
import OperationalReports from './components/manager/OperationalReports';
import XReport from './components/manager/XReport';
import ZReport from './components/manager/ZReport';
import { API_ENDPOINTS } from './config/api';

/**
 * Manager Dashboard
 * Full access to inventory, menu, employees, and reports
 */
export default function Manager() {
  const [activeTab, setActiveTab] = useState('inventory');
  const navigate = useNavigate();

  // Accessibility states
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [largeClickTargets, setLargeClickTargets] = useState(false);
  
  // Language & Translation
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedData, setTranslatedData] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  // Handle language change (database-backed translation system)
  const handleLanguageChange = async (lang) => {
    if (lang === 'en') {
      setSelectedLanguage('en');
      setTranslatedData({});
      setForceRender(prev => prev + 1);
      return;
    }

    setIsTranslating(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const dbUrl = `${API_BASE_URL}/api/translations/${lang}`;
      
      console.log('📡 Fetching translations from:', dbUrl);
      
      const dbResponse = await fetch(dbUrl);
      
      if (!dbResponse.ok) {
        throw new Error(`Database fetch failed: ${dbResponse.status} ${dbResponse.statusText}`);
      }
      
      const dbData = await dbResponse.json();
      const { translations, count } = dbData;
      
      // Define all the text that needs translation
      const staticLabels = [
        // Main UI labels
        'Manager Dashboard', 'ShareNook - Management System', 'Manager',
        'Back', 'Back to Role Selection', 'Accessibility', 'Accessibility Options',
        
        // Tab names
        'Inventory', 'Menu', 'Employees', 'Ordering Trends', 'Operational Reports', 'Z-Report (End of Day)',
        
        // Accessibility labels
        'Text Size', 'Normal', 'Large', 'Extra Large',
        'Display Mode', 'High Contrast ON', 'Normal Mode',
        'Button Size', 'Large Buttons', 'Standard Buttons',
        'Animation', 'No Animation', 'Animation ON', 'Close',
        
        // Common action words
        'Add', 'Edit', 'Delete', 'Save', 'Cancel', 'Submit', 'Search', 'Filter',
        'Export', 'Import', 'Refresh', 'View', 'Details', 'Actions', 'Confirm',
        'Loading...', 'Error', 'Success', 'Warning', 'Info', 'Yes', 'No',
        
        // Inventory Management
        'Inventory Management', 'Add Inventory Item', 'Edit Inventory Item',
        'Item Name', 'Quantity', 'Unit', 'Restock Date', 'Low Stock Alert',
        'Restock Threshold', 'Last Restocked', 'Stock Level', 'In Stock', 'Low Stock',
        'Out of Stock', 'Remove Item', 'Update Stock', 'Restock History',
        'Search inventory...', 'No inventory items found', 'Add First Item',
        
        // Menu Management
        'Menu Management', 'Add Menu Item', 'Edit Menu Item', 'Item Details',
        'Name', 'Price', 'Category', 'Type', 'Description', 'Available',
        'Unavailable', 'Make Available', 'Make Unavailable', 'Drink', 'Topping',
        'Delete Item', 'No menu items found', 'Search menu items...',
        'Menu Item Image', 'Add New Category', 'Size Options', 'Sweetness Options',
        'Ice Options', 'Extra Large', 'Medium Small',
        
        // Employee Management  
        'Employee Management', 'Add Employee', 'Edit Employee', 'Employee Details',
        'Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role',
        'Hire Date', 'Status', 'Active', 'Inactive', 'Hourly Rate', 'Hours Worked',
        'Total Earnings', 'Cashier', 'Manager', 'Admin', 'No employees found',
        'Search employees...', 'Delete Employee', 'Update Employee',
        
        // Ordering Trends
        'Product Sales Analytics', 'Sales Trends', 'Top Selling Items',
        'Revenue Analysis', 'Date Range', 'Start Date', 'End Date', 'Apply Filter',
        'Total Sales', 'Total Revenue', 'Average Order Value', 'Product Name',
        'Units Sold', 'Revenue', 'Percentage', 'Sales Chart', 'Daily', 'Weekly',
        'Monthly', 'No sales data available', 'Select dates to view trends',
        
        // Operational Reports
        'Sales Report', 'Product Usage', 'X-Report', 'Generate Report',
        'Report Type', 'Time Period', 'Today', 'This Week', 'This Month',
        'Custom Range', 'Download CSV', 'Download PDF', 'Print Report',
        'Transaction Count', 'Cash Transactions', 'Card Transactions',
        'Discount Applied', 'Tax Collected', 'Net Sales', 'Gross Sales',
        'Items Sold', 'Peak Hours', 'Sales by Hour', 'Sales by Day',
        'What Sells Together', 'Product Pairs', 'Frequently Bought Together',
        'Pair Frequency', 'Times Ordered Together',
        
        // Z-Report (End of Day)
        'Z-Report', 'End of Day Report', 'Close Register', 'Daily Summary',
        'Opening Balance', 'Closing Balance', 'Expected Cash', 'Actual Cash',
        'Cash Difference', 'Over', 'Short', 'Exact', 'Total Orders',
        'Payment Methods', 'Cash', 'Card', 'Credit Card', 'Debit Card',
        'Employee Sales', 'Hourly Breakdown', 'Generate Z-Report',
        'Print Z-Report', 'Email Report', 'Archive Report', 'Report Date',
        'Report Time', 'Generated By', 'Notes', 'Add Notes',
        
        // Common Messages
        'Are you sure?', 'This action cannot be undone.',
        'Successfully added!', 'Successfully updated!', 'Successfully deleted!',
        'Failed to add item.', 'Failed to update item.', 'Failed to delete item.',
        'Failed to load data.', 'Please fill in all required fields.',
        'Invalid input.', 'Operation successful!', 'Operation failed.',
        'No data available.', 'Loading data...', 'Saving changes...',
        'Processing...', 'Please wait...', 'Required field', 'Optional field'
      ];

      const allTexts = [...staticLabels];

      // Check which texts are missing from the database
      const missingTexts = allTexts.filter(text => !translations.hasOwnProperty(text));
      
      if (missingTexts.length > 0) {
        console.log(`📝 Found ${missingTexts.length} missing translations, populating...`);
        
        const populateUrl = `${API_BASE_URL}/api/translations/populate`;
        const populateResponse = await fetch(populateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: missingTexts, targetLang: lang })
        });

        if (!populateResponse.ok) {
          throw new Error(`Populate failed: ${populateResponse.status} ${populateResponse.statusText}`);
        }

        const result = await populateResponse.json();
        console.log(`✅ Populated ${result.newTranslations} new translations`);
        
        const updatedResponse = await fetch(dbUrl);
        const updatedData = await updatedResponse.json();
        setTranslatedData(updatedData.translations);
      } else {
        console.log(`✅ All ${count} translations already in database`);
        setTranslatedData(translations);
      }
      
      setSelectedLanguage(lang);
      setForceRender(prev => prev + 1);
    } catch (err) {
      console.error('❌ Translation error:', err);
      alert(`Translation error: ${err.message}\n\nMake sure the backend server is running!`);
      setSelectedLanguage('en');
    } finally {
      setIsTranslating(false);
    }
  };

  // Get translated text with useMemo for performance
  const getTranslatedText = useMemo(() => {
    return (text) => {
      if (selectedLanguage === 'en' || !text) return text;
      return translatedData[text] || text;
    };
  }, [selectedLanguage, translatedData, forceRender]);

  // Get container class with accessibility settings
  const getContainerClass = () => {
    let classes = 'min-h-screen';
    
    if (highContrast) {
      classes += ' bg-black text-white';
    } else {
      classes += ' bg-gray-50';
    }
    
    if (fontSize === 'large') classes += ' text-lg';
    if (fontSize === 'extra-large') classes += ' text-xl';
    
    return classes;
  };

  // Accessibility Menu Component
  const AccessibilityMenu = () => (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={() => setShowAccessibilityMenu(false)}
    >
      <div 
        className={`rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${
          highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-3xl font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            ♿ {getTranslatedText('Accessibility')}
          </h2>
          <button
            onClick={() => setShowAccessibilityMenu(false)}
            className={`text-2xl ${highContrast ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-700'}`}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            ✕
          </button>
        </div>

        {/* Font Size Controls */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            📝 {getTranslatedText('Text Size')}
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setFontSize('normal')}
              className={`flex-1 px-6 py-6 rounded-lg font-bold transition-colors ${
                fontSize === 'normal'
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-purple-600 text-white'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{ minHeight: '80px' }}
            >
              <div className="text-base">A</div>
              <div className="text-sm mt-2">{getTranslatedText('Normal')}</div>
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`flex-1 px-6 py-6 rounded-lg font-bold transition-colors ${
                fontSize === 'large'
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-purple-600 text-white'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{ minHeight: '80px' }}
            >
              <div className="text-xl">A</div>
              <div className="text-sm mt-2">{getTranslatedText('Large')}</div>
            </button>
            <button
              onClick={() => setFontSize('extra-large')}
              className={`flex-1 px-6 py-6 rounded-lg font-bold transition-colors ${
                fontSize === 'extra-large'
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-purple-600 text-white'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{ minHeight: '80px' }}
            >
              <div className="text-2xl">A</div>
              <div className="text-sm mt-2">{getTranslatedText('Extra Large')}</div>
            </button>
          </div>
        </div>

        {/* High Contrast Toggle */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            🎨 {getTranslatedText('Display Mode')}
          </h3>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-full py-6 rounded-lg font-bold transition-colors text-xl ${
              highContrast
                ? 'bg-yellow-400 text-black border-4 border-yellow-400'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
            style={{ minHeight: '80px' }}
          >
            {highContrast ? '🌞 ' + getTranslatedText('High Contrast ON') : '🌙 ' + getTranslatedText('Normal Mode')}
          </button>
        </div>

        {/* Large Click Targets */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            👆 {getTranslatedText('Button Size')}
          </h3>
          <button
            onClick={() => setLargeClickTargets(!largeClickTargets)}
            className={`w-full py-6 rounded-lg font-bold transition-colors text-xl ${
              largeClickTargets
                ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-purple-600 text-white'
                : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={{ minHeight: '80px' }}
          >
            {largeClickTargets ? '✓ ' + getTranslatedText('Large Buttons') : getTranslatedText('Standard Buttons')}
          </button>
        </div>

        {/* Reduce Motion */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            🎬 {getTranslatedText('Animation')}
          </h3>
          <button
            onClick={() => setReduceMotion(!reduceMotion)}
            className={`w-full py-6 rounded-lg font-bold transition-colors text-xl ${
              reduceMotion
                ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-purple-600 text-white'
                : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={{ minHeight: '80px' }}
          >
            {reduceMotion ? '🚫 ' + getTranslatedText('No Animation') : '✨ ' + getTranslatedText('Animation ON')}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setShowAccessibilityMenu(false)}
          className={`w-full mt-4 py-4 rounded-lg font-semibold transition-colors ${
            highContrast
              ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={{ minHeight: '60px' }}
        >
          {getTranslatedText('Close')}
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'menu', name: 'Menu', icon: '🍽️' },
    { id: 'employees', name: 'Employees', icon: '👥' },
    { id: 'trends', name: 'Ordering Trends', icon: '📈' },
    { id: 'reports', name: 'Operational Reports', icon: '📊' },
    { id: 'xreport', name: 'X-Report (Current Session)', icon: '💹' },
    { id: 'zreport', name: 'Z-Report (End of Day)', icon: '📋' },
  ];

  return (
    <div className={`manager-view ${getContainerClass()}`}>
      {/* Header */}
      <header className={`shadow-lg ${
        highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-gradient-to-r from-purple-600 to-purple-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className={`text-3xl font-bold ${
                  highContrast ? 'text-yellow-400' : 'text-white'
                }`}>
                  {getTranslatedText('Manager Dashboard')}
                </h1>
                <p className={`mt-1 ${
                  highContrast ? 'text-gray-300' : 'text-purple-100'
                }`}>
                  {getTranslatedText('ShareNook - Management System')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <span className={`text-sm ${highContrast ? 'text-yellow-400' : 'text-white'}`}>🌐</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium focus:outline-none focus:ring-4 ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-yellow-400 focus:ring-yellow-400'
                      : 'bg-white text-gray-800 border-gray-300 focus:ring-purple-500'
                  }`}
                  style={{ minHeight: '44px' }}
                  disabled={isTranslating}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh-CN">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="ar">العربية</option>
                  <option value="hi">हिन्दी</option>
                </select>
                {isTranslating && (
                  <span className={`text-sm ${highContrast ? 'text-yellow-400' : 'text-white'}`}>...</span>
                )}
              </div>

              {/* Accessibility Toggle Button */}
              <button
                onClick={() => setShowAccessibilityMenu(true)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-white text-purple-700 hover:bg-purple-50'
                }`}
                style={{ minHeight: '44px' }}
                title={getTranslatedText('Accessibility Options')}
              >
                ♿ {getTranslatedText('Accessibility')}
              </button>

              <div className={`px-4 py-2 rounded-lg ${
                highContrast ? 'bg-gray-800 text-yellow-400' : 'bg-purple-700'
              }`}>
                <span className={`font-semibold ${highContrast ? 'text-yellow-400' : 'text-white'}`}>
                  {getTranslatedText('Manager')}
                </span>
              </div>
              <UserButton afterSignOutUrl={import.meta.env.BASE_URL} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={`border-b shadow-sm ${
        highContrast ? 'bg-gray-900 border-yellow-400' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? highContrast 
                      ? 'bg-yellow-400 text-black border-4 border-yellow-400' 
                      : 'bg-purple-600 text-white shadow-md'
                    : highContrast
                      ? 'text-yellow-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ minHeight: largeClickTargets ? '60px' : '44px' }}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{getTranslatedText(tab.name)}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'inventory' && (
          <Inventory 
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
            fontSize={fontSize}
            largeClickTargets={largeClickTargets}
          />
        )}
        {activeTab === 'menu' && (
          <Menu 
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
            fontSize={fontSize}
            largeClickTargets={largeClickTargets}
          />
        )}
        {activeTab === 'employees' && (
          <Employees 
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
            fontSize={fontSize}
            largeClickTargets={largeClickTargets}
          />
        )}
        {activeTab === 'trends' && (
          <OrderingTrends 
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
            fontSize={fontSize}
            largeClickTargets={largeClickTargets}
          />
        )}
        {activeTab === 'reports' && (
          <OperationalReports 
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
            fontSize={fontSize}
            largeClickTargets={largeClickTargets}
          />
        )}
        {activeTab === 'xreport' && (
          <XReport 
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
            fontSize={fontSize}
            largeClickTargets={largeClickTargets}
          />
        )}
        {activeTab === 'zreport' && (
          <ZReport 
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
            fontSize={fontSize}
            largeClickTargets={largeClickTargets}
          />
        )}
      </main>

      {/* Accessibility Menu Modal */}
      {showAccessibilityMenu && <AccessibilityMenu />}
    </div>
  );
}
