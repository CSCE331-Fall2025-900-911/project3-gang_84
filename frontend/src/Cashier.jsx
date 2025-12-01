import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import CashierView from './components/views/CashierView';
import CustomerLookupModal from './components/modals/CustomerLookupModal';
import PaymentModal from './components/modals/PaymentModal';
import ThankYouScreen from './components/views/ThankYouScreen';
import { API_ENDPOINTS } from './config/api';

/**
 * Cashier POS System
 * Optimized for experienced cashier users
 * Features: Quick order entry, keyboard shortcuts, split-screen layout
 */
export default function Cashier() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // State
  const [cart, setCart] = useState([]);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  
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

  // Cart total calculation
  const cartTotal = cart.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * item.quantity);
  }, 0);

  // Add item to cart
  const handleAddToCart = (drink) => {
    setCart((prevCart) => {
      // Check if item already exists
      const existingIndex = prevCart.findIndex(item => 
        item.menuitemid === drink.menuitemid &&
        JSON.stringify(item.customizations) === JSON.stringify(drink.customizations)
      );

      if (existingIndex >= 0) {
        // Increment quantity
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        return newCart;
      } else {
        // Add new item
        return [...prevCart, { ...drink, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Clear cart
  const handleClearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  // Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    setShowCustomerLookup(true);
  };

  // Handle customer lookup completion
  const handleCustomerLookupContinue = (customer) => {
    setCurrentCustomer(customer);
    setShowCustomerLookup(false);
    setShowPaymentModal(true);
  };

  // Handle skip customer lookup
  const handleSkipCustomerLookup = () => {
    setCurrentCustomer(null);
    setShowCustomerLookup(false);
    setShowPaymentModal(true);
  };

  // Process payment
  const handlePaymentSelect = async (paymentType, rewardsData = {}) => {
    try {
      console.log('💳 Processing payment...');
      console.log('  Payment type:', paymentType);
      console.log('  Cart:', cart);
      console.log('  Customer:', currentCustomer);
      console.log('  Rewards:', rewardsData);

      const orderData = {
        cartItems: cart.map(item => ({
          menuitemid: item.menuitemid,
          quantity: item.quantity,
          price: item.price,
          customizations: item.customizations
        })),
        totalCost: rewardsData.finalTotal !== undefined ? rewardsData.finalTotal : cartTotal,
        customerId: currentCustomer?.customerid || null,
        employeeId: user?.publicMetadata?.employeeId || null,
        paymentType: paymentType,
        rewardsUsed: rewardsData.selectedRewards || [],
        rewardDiscount: rewardsData.rewardDiscount || 0,
        pointsRedeemed: rewardsData.pointsUsed || 0
      };

      console.log('  Order data:', orderData);

      const response = await fetch(API_ENDPOINTS.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      console.log('  Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('  Error response:', errorData);
        throw new Error(errorData.error || 'Order submission failed');
      }

      const result = await response.json();
      console.log('  Order result:', result);
      console.log('  Order result type:', typeof result);
      console.log('  Order result keys:', Object.keys(result));
      console.log('  orderId value:', result.orderId);
      console.log('  orderid value:', result.orderid);
      
      // Check for both camelCase and lowercase
      const orderIdValue = result.orderId || result.orderid;
      
      if (!orderIdValue) {
        console.error('  ❌ No order ID in response!');
        console.error('  Full result object:', JSON.stringify(result, null, 2));
        throw new Error('Order created but no order ID returned');
      }
      
      console.log('  ✅ Using order ID:', orderIdValue);
      setOrderNumber(orderIdValue);
      setShowPaymentModal(false);
      setShowThankYou(true);
      setCart([]);
      setCurrentCustomer(null); // Reset customer after order
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`Failed to process order: ${error.message}`);
    }
  };

  // New order
  const handleNewOrder = () => {
    setShowThankYou(false);
    setOrderNumber(null);
  };

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
    // Translation will be handled by child components
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
      classes += ' bg-gradient-to-br from-green-50 to-green-100';
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
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-600 text-white'
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
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-600 text-white'
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
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-600 text-white'
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
                ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-600 text-white'
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
                ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-600 text-white'
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

  if (showThankYou) {
    return (
      <ThankYouScreen
        orderNumber={orderNumber}
        onNewOrder={handleNewOrder}
        highContrast={highContrast}
        getTranslatedText={getTranslatedText}
      />
    );
  }

  return (
    <div className={getContainerClass()}>
      {/* Header */}
      <header className={`sticky top-0 z-40 shadow-md ${
        highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-gradient-to-r from-green-600 to-green-700'
      }`}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Back Button + Title */}
          <div className="flex items-center gap-8">
            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className={`px-6 py-4 rounded-lg font-semibold transition-colors flex items-center gap-2 text-lg ${
                highContrast
                  ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{ minHeight: '60px' }}
              title={getTranslatedText('Back to Role Selection')}
            >
              ← {getTranslatedText('Back')}
            </button>

            <h1 className={`text-3xl font-bold ${
              highContrast ? 'text-yellow-400' : 'text-white'
            }`}>
              {getTranslatedText('ShareTea')}
            </h1>
          </div>
          
          {/* Right: User Info + Language + Accessibility */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <span className={`text-sm ${
                  highContrast ? 'text-gray-300' : 'text-white'
                }`}>
                  {user.firstName || user.username}
                </span>
                <UserButton afterSignOutUrl="/" />
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${highContrast ? 'text-yellow-400' : 'text-white'}`}>🌐</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`px-4 py-2 rounded-lg border-2 font-medium focus:outline-none focus:ring-4 ${
                  highContrast
                    ? 'bg-black text-yellow-400 border-yellow-400 focus:ring-yellow-400'
                    : 'bg-white text-gray-800 border-gray-300 focus:ring-green-500'
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
                  : 'bg-white text-green-700 hover:bg-green-50'
              }`}
              style={{ minHeight: '44px' }}
              title={getTranslatedText('Accessibility Options')}
            >
              ♿ {getTranslatedText('Accessibility')}
            </button>
          </div>
        </div>
      </header>

      {/* Main POS Interface */}
      <CashierView
        highContrast={highContrast}
        fontSize={fontSize}
        largeClickTargets={largeClickTargets}
        reduceMotion={reduceMotion}
        getTranslatedText={getTranslatedText}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        cart={cart}
        onCheckout={handleCheckout}
        onClearCart={handleClearCart}
        cartTotal={cartTotal}
        selectedLanguage={selectedLanguage}
        translateText={translateText}
      />

      {/* Customer Lookup Modal */}
      {showCustomerLookup && (
        <CustomerLookupModal
          onContinue={handleCustomerLookupContinue}
          onSkip={handleSkipCustomerLookup}
          highContrast={highContrast}
          getTranslatedText={getTranslatedText}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={cartTotal}
          customer={currentCustomer}
          cart={cart}
          onCancel={() => setShowPaymentModal(false)}
          onPaymentSelect={handlePaymentSelect}
          highContrast={highContrast}
          getTranslatedText={getTranslatedText}
        />
      )}

      {/* Accessibility Menu Modal */}
      {showAccessibilityMenu && <AccessibilityMenu />}
    </div>
  );
}
