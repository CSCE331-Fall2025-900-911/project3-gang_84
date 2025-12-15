import React, { useState, useMemo, useEffect } from 'react';
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
  const [largeClickTargets, setLargeClickTargets] = useState(false);
  
  // Language & Translation
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedData, setTranslatedData] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [forceRender, setForceRender] = useState(0); // Force re-render on language change
  
  // Menu data state (needed for translation)
  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [sweetnessOptions, setSweetnessOptions] = useState([]);
  const [iceOptions, setIceOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  
  // Fetch menu data on mount (needed for translations)
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.menu);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories.map(c => c.category));
          setDrinks(data.menu_items.filter(item => item.type === 'Drink'));
          setToppings(data.toppings);
          setSweetnessOptions(data.sweetness_options);
          setIceOptions(data.ice_options);
          setSizeOptions(data.size_options);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    };
    fetchMenu();
  }, []);

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

  // Increase quantity of an item in the cart
  const handleIncreaseQuantity = (index) => {
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Decrease quantity of an item in the cart (remove if quantity becomes 0)
  const handleDecreaseQuantity = (index) => {
    setCart(prev => {
      const item = prev[index];
      if (item.quantity === 1) {
        // Remove item if quantity is 1
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((item, i) => 
        i === index ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
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
      // Get API base URL from environment or default to localhost
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // First, try to fetch from database (fast!)
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
        // Original labels
        'Sweetness Level', 'Ice Level', 'Size', 'Toppings', 'Total', 'Add to Cart',
        'View Cart', 'Your cart is empty.', 'Sweetness:', 'Ice:', 'Size:', 'Toppings:', 
        'Pay', 'Menu', 'Cashier System', 'Accessibility:', 'Text Size:', 
        'Normal', 'Large', 'Extra Large', 'High Contrast', 'Language:',
        
        // Sweetness/Ice/Size options (modification values)
        'Regular', 'Less', 'No Ice', 'Small', 'Medium',
        'Normal (100%)', 'Less (75%)', 'Half (50%)', 'Light (25%)', 'No Sugar (0%)', 'Extra Sugar (125%)',
        
        // Cart View labels
        'Back to Menu', 'Your Cart', 'Your cart is empty', 'Add some drinks to get started!',
        'Browse Menu', 'Quantity', 'each', 'Rewards', 'points', 'Redeem your points for rewards!',
        'Free Drink', 'Get any drink for free', 'Free Topping', 'Add a free topping to any drink',
        '20% Off', '20% off your entire order', 'Buy One Get One', 'Get the cheapest drink free',
        'Not enough points', 'Subtotal', 'Rewards Savings', 'Proceed to Checkout',
        
        // Customer Lookup Modal labels
        'Customer Lookup', 'Lookup Customer', 'Looking up...', 'Skip', 'Continue Without Customer', 
        'Enter Phone Number', 'Phone Number', 'Search', 'Customer Name', 'Loyalty Points', 'Points',
        'Select Customer', 'No customer found', 'Customer has enough points for a reward!', 'Continue to Payment',
        'Try Different Number', 'Enter phone number to apply rewards', 'Phone number must be 10 digits',
        'Please enter a phone number', 'Customer not found.', 'Customer not found. Create a new account?',
        'Creating...', 'Create Account', 'Back to Lookup', '100 points', 'Free drink',
        
        // Payment Modal labels
        'Select Payment Method', 'Cash', 'Credit Card', 'Debit Card', 'Cancel',
        'Customer', 'Points Remaining', 'Available Rewards', 'Applied', 'Total Discount',
        'New Total', 'Card', 'Credit or Debit', 'Pay at counter',
        
        // Thank You Screen labels
        'Thank You', 'Your order has been placed successfully!', 'Order Number',
        'Please wait for your order to be prepared', 'Place New Order',
        
        // Cashier-specific labels
        'Clear Cart', 'Checkout', 'Remove', 'Add Another', 'Current Order',
        'Items in Cart', 'Accessibility Menu', 'Display Mode', 'Button Size',
        'Reduce Motion', 'Large Click Targets', 'High Contrast ON', 'Normal Mode',
        'ShareNook', 'Cashier', 'Accessibility Options', 'Close',
        'Large Buttons', 'Standard Buttons', 'Animation', 'No Animation', 'Animation ON',
        'No items yet', 'Click drinks to add', 'toppings', 'Customize',
        'Shortcuts', 'Click: Quick add', 'Right-click: Customize', 'Clear',
        
        // CashierView customization modal labels
        'Base', 'Select Multiple',
        
        // Error messages
        'Please enter a valid 10-digit phone number',
        'Phone number not found. Please sign up or try a different number.',
        'Unable to connect to server. Please try again.',
        'PIN must be 4 digits', 'Incorrect PIN. Please try again.',
        'Cart is empty',
        
        // Search and Navigation
        'Search drinks...', 'Search drinks... (Press / to focus)', 'Clear search', 'Cashier POS'
      ];

      const allTexts = [
        ...staticLabels,
        ...categories,
        ...drinks.map(d => d.name),
        ...toppings.map(t => t.name),
        ...sweetnessOptions.map(o => o.name),
        ...iceOptions.map(o => o.name),
        ...sizeOptions.map(o => o.name)
      ];

      // Check which texts are missing from the database
      const missingTexts = allTexts.filter(text => !translations.hasOwnProperty(text));
      
      if (missingTexts.length > 0) {
        console.log(`📝 Found ${missingTexts.length} missing translations, populating...`);
        
        // Populate only the missing translations
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
        
        // Fetch updated translations from database
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
      setSelectedLanguage('en'); // Reset to English on error
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

  // Text size helper functions for granular control
  const getTextSizeClass = () => {
    switch(fontSize) {
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  };

  const getSmallTextClass = () => {
    switch(fontSize) {
      case 'large': return 'text-base';
      case 'extra-large': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const getExtraSmallTextClass = () => {
    switch(fontSize) {
      case 'large': return 'text-sm';
      case 'extra-large': return 'text-base';
      default: return 'text-xs';
    }
  };

  const getHeadingSizeClass = (level) => {
    switch(level) {
      case 'h1':
        return fontSize === 'extra-large' ? 'text-5xl' : fontSize === 'large' ? 'text-4xl' : 'text-3xl';
      case 'h2':
        return fontSize === 'extra-large' ? 'text-4xl' : fontSize === 'large' ? 'text-3xl' : 'text-2xl';
      case 'h3':
        return fontSize === 'extra-large' ? 'text-3xl' : fontSize === 'large' ? 'text-2xl' : 'text-xl';
      default:
        return getTextSizeClass();
    }
  };

  // Get container class with accessibility settings
  const getContainerClass = () => {
    let classes = 'min-h-screen';
    
    if (highContrast) {
      classes += ' bg-black text-white';
    } else {
      classes += ' bg-gradient-to-br from-green-50 to-green-100';
    }
    
    // Text sizing handled at component level for granular control
    
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
          <h2 className={`font-bold ${getHeadingSizeClass('h2')} ${highContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
            {getTranslatedText('Accessibility')}
          </h2>
          <button
            onClick={() => setShowAccessibilityMenu(false)}
            aria-label="Close accessibility menu"
            className={`text-2xl ${highContrast ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-700 hover:text-gray-900'}`}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            ✕
          </button>
        </div>

        {/* Font Size Controls */}
        <div className="mb-6">
          <h3 className={`font-semibold mb-3 ${getHeadingSizeClass('h3')} ${highContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
            {getTranslatedText('Text Size')}
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setFontSize('normal')}
              className={`flex-1 px-6 py-6 rounded-lg font-bold transition-colors ${
                fontSize === 'normal'
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-700 text-white'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
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
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-700 text-white'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
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
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-700 text-white'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
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
          <h3 className={`font-semibold mb-3 ${getHeadingSizeClass('h3')} ${highContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
            {getTranslatedText('Display Mode')}
          </h3>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`w-full py-6 rounded-lg font-bold transition-colors ${getTextSizeClass()} ${
              highContrast
                ? 'bg-yellow-400 text-black border-4 border-yellow-400'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
            style={{ minHeight: '80px' }}
          >
            {highContrast ? getTranslatedText('High Contrast ON') : getTranslatedText('Normal Mode')}
          </button>
        </div>

        {/* Large Click Targets */}
        <div className="mb-6">
          <h3 className={`font-semibold mb-3 ${getHeadingSizeClass('h3')} ${highContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
            {getTranslatedText('Button Size')}
          </h3>
          <button
            onClick={() => setLargeClickTargets(!largeClickTargets)}
            className={`w-full py-6 rounded-lg font-bold transition-colors ${getTextSizeClass()} ${
              largeClickTargets
                ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400' : 'bg-green-700 text-white'
                : highContrast ? 'bg-gray-800 text-yellow-400 border-4 border-yellow-400' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-300'
            }`}
            style={{ minHeight: '80px' }}
          >
            {largeClickTargets ? getTranslatedText('Large Buttons') : getTranslatedText('Standard Buttons')}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setShowAccessibilityMenu(false)}
          className={`w-full mt-4 py-4 rounded-lg font-semibold transition-colors ${
            highContrast
              ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
              : 'bg-gray-800 text-white hover:bg-gray-900'
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
    <div className={`cashier-view ${getContainerClass()}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 shadow-md ${
        highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-gradient-to-r from-green-700 to-green-800'
      }`}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Title */}
          <div className="flex items-center gap-8">
            <h1 className={`text-3xl font-bold ${
              highContrast ? 'text-yellow-400' : 'text-white'
            }`}>
              {getTranslatedText('ShareNook')} - {getTranslatedText('Cashier')}
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
                <UserButton afterSignOutUrl={import.meta.env.BASE_URL} />
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
                    : 'bg-white text-gray-900 border-gray-300 focus:ring-green-500'
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
              {getTranslatedText('Accessibility')}
            </button>
          </div>
        </div>
      </header>

      {/* Main POS Interface */}
      <CashierView
        highContrast={highContrast}
        fontSize={fontSize}
        largeClickTargets={largeClickTargets}
        getTextSizeClass={getTextSizeClass}
        getSmallTextClass={getSmallTextClass}
        getExtraSmallTextClass={getExtraSmallTextClass}
        getHeadingSizeClass={getHeadingSizeClass}
        getTranslatedText={getTranslatedText}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        cart={cart}
        onCheckout={handleCheckout}
        onClearCart={handleClearCart}
        cartTotal={cartTotal}
        selectedLanguage={selectedLanguage}
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
