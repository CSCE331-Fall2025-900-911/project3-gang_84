import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import Inventory from './components/manager/Inventory';
import Menu from './components/manager/Menu';
import Employees from './components/manager/Employees';
import OrderingTrends from './components/manager/OrderingTrends';
import OperationalReports from './components/manager/OperationalReports';
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

  // Translation function
  const translateText = async (text, targetLang) => {
    if (targetLang === 'en' || !text) return text;
    
    const cacheKey = `${text}_${targetLang}`;
    if (translatedData[cacheKey]) {
      return translatedData[cacheKey];
    }

    try {
      const response = await fetch(API_ENDPOINTS.translate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });
      
      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText;
        setTranslatedData(prev => ({ ...prev, [cacheKey]: translated }));
        return translated;
      }
    } catch (err) {
      console.error('Translation error:', err);
    }
    return text;
  };

  // Handle language change
  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    if (lang === 'en') {
      setTranslatedData({});
      return;
    }
    setIsTranslating(true);
    
    // Pre-translate common UI elements
    const textsToTranslate = [
      'Manager Dashboard',
      'Kung Fu Tea - Management System',
      'Manager',
      'Back',
      'Back to Role Selection',
      'Accessibility',
      'Accessibility Options',
      'Inventory',
      'Menu',
      'Employees',
      'Ordering Trends',
      'Operational Reports',
      'Z-Report (End of Day)',
      'Text Size',
      'Normal',
      'Large',
      'Extra Large',
      'Display Mode',
      'High Contrast ON',
      'Normal Mode',
      'Button Size',
      'Large Buttons',
      'Standard Buttons',
      'Animation',
      'No Animation',
      'Animation ON',
      'Close'
    ];

    for (const text of textsToTranslate) {
      await translateText(text, lang);
    }
    
    setIsTranslating(false);
  };

  // Get translated text
  const getTranslatedText = (text) => {
    if (selectedLanguage === 'en' || !text) return text;
    const cacheKey = `${text}_${selectedLanguage}`;
    return translatedData[cacheKey] || text;
  };

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
    { id: 'zreport', name: 'Z-Report (End of Day)', icon: '📋' },
  ];

  return (
    <div className={getContainerClass()}>
      {/* Header */}
      <header className={`shadow-lg ${
        highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-gradient-to-r from-purple-600 to-purple-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={() => navigate('/')}
                className={`px-6 py-4 rounded-lg font-semibold transition-colors flex items-center gap-2 text-lg ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-purple-700 text-white hover:bg-purple-900 border-2 border-purple-500'
                }`}
                style={{ minHeight: '60px' }}
                title={getTranslatedText('Back to Role Selection')}
              >
                ← {getTranslatedText('Back')}
              </button>
              
              <div>
                <h1 className={`text-3xl font-bold ${
                  highContrast ? 'text-yellow-400' : 'text-white'
                }`}>
                  {getTranslatedText('Manager Dashboard')}
                </h1>
                <p className={`mt-1 ${
                  highContrast ? 'text-gray-300' : 'text-purple-100'
                }`}>
                  {getTranslatedText('Kung Fu Tea - Management System')}
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
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'menu' && <Menu />}
        {activeTab === 'employees' && <Employees />}
        {activeTab === 'trends' && <OrderingTrends />}
        {activeTab === 'reports' && <OperationalReports />}
        {activeTab === 'zreport' && <ZReport />}
      </main>

      {/* Accessibility Menu Modal */}
      {showAccessibilityMenu && <AccessibilityMenu />}
    </div>
  );
}
