import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Cashier POS Interface
 * Split-screen: Menu (70%) | Cart (30%)
 * Optimized for experienced users with keyboard shortcuts
 */
export default function CashierView({ 
  highContrast,
  fontSize,
  largeClickTargets,
  reduceMotion,
  getTranslatedText,
  onAddToCart,
  onRemoveFromCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
  cart,
  onCheckout,
  onClearCart,
  cartTotal,
  selectedLanguage
}) {
  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customization options
  const [toppings, setToppings] = useState([]);
  const [sweetnessOptions, setSweetnessOptions] = useState([]);
  const [iceOptions, setIceOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  
  // Customization modal
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // / key - Focus search
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // F2 - Checkout
      if (e.key === 'F2') {
        e.preventDefault();
        onCheckout();
      }
      // Escape - Clear search or cart
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else if (cart.length > 0) {
          onClearCart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, cart.length]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.menu);
      if (!response.ok) throw new Error('Failed to fetch menu');
      
      const data = await response.json();
      
      // Extract unique categories from drinks and miscellaneous items
      const drinkItems = data.menu_items.filter(item => item.type === 'Drink');
      const miscItems = data.menu_items.filter(item => item.category === 'Miscellaneous');
      const allOrderableItems = [...drinkItems, ...miscItems];
      
      const uniqueCategories = [...new Set(allOrderableItems.map(item => item.category))];
      
      setCategories(['All', ...uniqueCategories]);
      setDrinks(allOrderableItems);
      
      // Set customization options from database
      setToppings(data.toppings || []);
      setSweetnessOptions(data.sweetness_options || []);
      setIceOptions(data.ice_options || []);
      setSizeOptions(data.size_options || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setLoading(false);
    }
  };

  // Filter drinks
  const filteredDrinks = drinks.filter(drink => {
    const matchesCategory = selectedCategory === 'All' || drink.category === selectedCategory;
    const matchesSearch = drink.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Quick add (no customizations)
  const handleQuickAdd = (drink) => {
    onAddToCart({
      ...drink,
      customizations: {
        sweetness: 'Regular',
        ice: 'Regular',
        toppings: []
      }
    });
  };

  // Open customization modal
  const handleCustomize = (drink) => {
    setSelectedDrink(drink);
    setShowCustomizationModal(true);
  };

  // Add customized drink to cart
  const handleAddCustomized = (customizedDrink) => {
    onAddToCart(customizedDrink);
    setShowCustomizationModal(false);
    setSelectedDrink(null);
  };

  // Get button size class based on accessibility settings
  const getButtonSizeClass = () => {
    if (largeClickTargets) {
      return 'min-h-[80px] text-lg';
    }
    return 'min-h-[60px]';
  };

  // Get font size class
  const getFontSizeClass = () => {
    if (fontSize === 'large') return 'text-lg';
    if (fontSize === 'extra-large') return 'text-xl';
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={highContrast ? 'text-yellow-400' : 'text-green-600'}>
          Loading menu...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-64px)] ${getFontSizeClass()}`}>
      {/* Left Side - Menu (70%) */}
      <div className="w-[70%] flex flex-col border-r-2 border-green-300">
        {/* Search and Categories */}
        <div className={`p-4 border-b-2 ${
          highContrast ? 'bg-gray-900 border-yellow-400' : 'bg-white border-green-200'
        }`}>
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder={getTranslatedText('Search drinks... (Press / to focus)')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 rounded-lg ${getButtonSizeClass()} ${
                highContrast
                  ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 placeholder-gray-500'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`menuButton px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${getButtonSizeClass()} ${
                  selectedCategory === category
                    ? highContrast
                      ? 'bg-yellow-400 text-black'
                      : 'bg-green-600 text-white'
                    : highContrast
                      ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-4">
            {filteredDrinks.map((drink) => (
              <div
                key={drink.menuitemid}
                className={`p-4 rounded-lg text-left transition-all cursor-pointer relative group ${getButtonSizeClass()} ${
                  reduceMotion ? '' : 'hover:scale-105'
                } ${
                  highContrast
                    ? 'bg-gray-800 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-white shadow-md hover:shadow-lg'
                }`}
                onClick={() => handleQuickAdd(drink)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleCustomize(drink);
                }}
              >
                {/* Customize button overlay (appears on hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCustomize(drink);
                    }}
                    className={`p-2 rounded ${
                      highContrast
                        ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={getTranslatedText('Customize')}
                  >
                    ⚙️
                  </button>
                </div>
                
                <div className={`font-bold mb-1 ${
                  largeClickTargets ? 'text-xl' : 'text-lg'
                } ${
                  highContrast ? 'text-yellow-400' : 'text-gray-800'
                }`}>
                  {getTranslatedText(drink.name)}
                </div>
                <div className={`font-bold ${
                  largeClickTargets ? 'text-2xl' : 'text-xl'
                } ${
                  highContrast ? 'text-white' : 'text-green-600'
                }`}>
                  ${parseFloat(drink.price).toFixed(2)}
                </div>
                {drink.category && (
                  <div className={`text-xs mt-1 ${
                    highContrast ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {getTranslatedText(drink.category)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className={`p-2 text-xs text-center border-t ${
          highContrast ? 'bg-gray-900 text-gray-400 border-yellow-400' : 'bg-gray-100 text-gray-600 border-gray-200'
        }`}>
          <span className="font-semibold">{getTranslatedText('Shortcuts')}:</span> / = {getTranslatedText('Search')} | F2 = {getTranslatedText('Checkout')} | Esc = {getTranslatedText('Clear')} | {getTranslatedText('Click: Quick add')} | {getTranslatedText('Right-click: Customize')}
        </div>
      </div>

      {/* Right Side - Cart (30%) */}
      <div className={`w-[30%] flex flex-col ${
        highContrast ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Cart Header */}
        <div className={`p-4 border-b-2 ${
          highContrast ? 'border-yellow-400' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            highContrast ? 'text-yellow-400' : 'text-gray-800'
          }`}>
            {getTranslatedText('Current Order')}
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className={`text-center py-8 ${
              highContrast ? 'text-white' : 'text-gray-500'
            }`}>
              <div className="text-4xl mb-2">🛒</div>
              <p>{getTranslatedText('No items yet')}</p>
              <p className="text-sm mt-1">{getTranslatedText('Click drinks to add')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={`${item.menuitemid}-${index}`}
                  className={`p-3 rounded-lg flex justify-between ${
                    highContrast
                      ? 'bg-gray-800 border border-yellow-400'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-semibold ${
                        highContrast ? 'text-yellow-400' : 'text-gray-800'
                      }`}>
                        {getTranslatedText(item.name)}
                      </span>
                    </div>
                    {item.customizations && (
                      <div className={`text-xs mt-1 ${
                        highContrast ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {getTranslatedText(item.customizations.size)} • {getTranslatedText(item.customizations.sweetness)} • {getTranslatedText(item.customizations.ice)}
                        {item.customizations.toppings.length > 0 && (
                          <span> • +{item.customizations.toppings.length} {getTranslatedText('toppings')}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-0.5 mt-1">
                      <button
                        onClick={() => onDecreaseQuantity(index)}
                        className={`h-4 w-4 rounded text-xs font-bold leading-none transition-colors ${
                          highContrast
                            ? 'bg-gray-700 text-yellow-400 border border-yellow-400 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={`text-xs min-w-[20px] text-center ${
                        highContrast ? 'text-white' : 'text-gray-800'
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onIncreaseQuantity(index)}
                        className={`h-4 w-4 rounded text-xs font-bold leading-none transition-colors ${
                          highContrast
                            ? 'bg-gray-700 text-yellow-400 border border-yellow-400 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <span className={`text-xs ${
                        highContrast ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        × ${parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-1">
                    <span className={`font-bold text-sm mb-1 ${
                      highContrast ? 'text-white' : 'text-gray-800'
                    }`}>
                      ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                    </span>
                    <button
                      onClick={() => onRemoveFromCart(index)}
                      className={`h-6 w-6 rounded text-sm font-semibold leading-none transition-colors ${
                        highContrast
                          ? 'bg-red-700 text-white border border-yellow-400 hover:bg-red-600'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                      aria-label={`${getTranslatedText('Remove')} ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total and Actions */}
        <div className={`p-4 border-t ${
          highContrast ? 'border-yellow-400' : 'border-gray-200'
        }`}>
          {/* Total */}
          <div className="flex justify-between items-center mb-4">
            <span className={`${largeClickTargets ? 'text-2xl' : 'text-xl'} font-bold ${
              highContrast ? 'text-yellow-400' : 'text-gray-800'
            }`}>
              {getTranslatedText('Total')}:
            </span>
            <span className={`${largeClickTargets ? 'text-3xl' : 'text-2xl'} font-bold ${
              highContrast ? 'text-white' : 'text-green-600'
            }`}>
              ${cartTotal.toFixed(2)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className={`w-full ${getButtonSizeClass()} rounded-lg font-bold ${largeClickTargets ? 'text-xl' : 'text-lg'} transition-colors ${
                cart.length === 0
                  ? highContrast
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {getTranslatedText('Checkout')} (F2)
            </button>
            
            <button
              onClick={onClearCart}
              disabled={cart.length === 0}
              className={`w-full ${largeClickTargets ? 'py-4' : 'py-2'} rounded-lg font-semibold ${largeClickTargets ? 'text-lg' : 'text-base'} transition-colors ${
                cart.length === 0
                  ? highContrast
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getTranslatedText('Clear Cart')}
            </button>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomizationModal && selectedDrink && (
        <CustomizationModal
          drink={selectedDrink}
          onClose={() => {
            setShowCustomizationModal(false);
            setSelectedDrink(null);
          }}
          onAddToCart={handleAddCustomized}
          sweetnessOptions={sweetnessOptions}
          iceOptions={iceOptions}
          sizeOptions={sizeOptions}
          toppingOptions={toppings}
          highContrast={highContrast}
          getTranslatedText={getTranslatedText}
        />
      )}
    </div>
  );
}

// Customization Modal Component
function CustomizationModal({ drink, onClose, onAddToCart, sweetnessOptions, iceOptions, sizeOptions, toppingOptions, getTranslatedText, highContrast }) {
  const [sweetness, setSweetness] = useState(sweetnessOptions[0]);
  const [ice, setIce] = useState(iceOptions[0]);
  const [size, setSize] = useState(sizeOptions[0] || { name: 'Small', price: 0 });
  const [toppings, setToppings] = useState([]);

  const toggleTopping = (topping) => {
    setToppings((prev) => {
      const exists = prev.find((t) => t.menuitemid === topping.menuitemid);
      if (exists) {
        return prev.filter((t) => t.menuitemid !== topping.menuitemid);
      } else {
        return [...prev, topping];
      }
    });
  };

  const calculateTotal = () => {
    const basePrice = parseFloat(drink.price);
    const toppingsPrice = toppings.reduce((sum, t) => sum + parseFloat(t.price), 0);
    const sweetnessPrice = sweetness ? parseFloat(sweetness.price) : 0;
    const icePrice = ice ? parseFloat(ice.price) : 0;
    const sizePrice = size ? parseFloat(size.price) : 0;
    return basePrice + toppingsPrice + sweetnessPrice + icePrice + sizePrice;
  };

  const handleAddToCart = () => {
    const customizedDrink = {
      ...drink,
      customizations: {
        size: size.name,
        sweetness: sweetness.name,
        ice: ice.name,
        toppings: toppings.map(t => t.name),
      },
      price: calculateTotal().toFixed(2),
    };
    onAddToCart(customizedDrink);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: highContrast ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)' }} 
      onClick={onClose}
    >
      <div className={`rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${
        highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
      }`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
              {getTranslatedText(drink.name)}
            </h2>
            <p className={`text-lg ${highContrast ? 'text-white' : 'text-gray-600'}`}>
              {getTranslatedText('Base')}: ${parseFloat(drink.price).toFixed(2)}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className={`text-2xl ${highContrast ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✕
          </button>
        </div>

        {/* Size Selection */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold mb-2 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Size')}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {sizeOptions.map((option) => (
              <button
                key={option.menuitemid}
                onClick={() => setSize(option)}
                className={`px-3 py-3 rounded-lg font-semibold text-sm transition-colors ${
                  size?.menuitemid === option.menuitemid
                    ? highContrast ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white'
                    : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText(option.name)}
                {parseFloat(option.price) > 0 && <div className="text-xs">+${parseFloat(option.price).toFixed(2)}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Sweetness Level */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold mb-2 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Sweetness Level')}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {sweetnessOptions.map((option) => (
              <button
                key={option.menuitemid}
                onClick={() => setSweetness(option)}
                className={`px-3 py-3 rounded-lg font-semibold text-sm transition-colors ${
                  sweetness?.menuitemid === option.menuitemid
                    ? highContrast ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white'
                    : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText(option.name)}
                {parseFloat(option.price) > 0 && <div className="text-xs">+${parseFloat(option.price).toFixed(2)}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Ice Level */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold mb-2 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Ice Level')}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {iceOptions.map((option) => (
              <button
                key={option.menuitemid}
                onClick={() => setIce(option)}
                className={`px-3 py-3 rounded-lg font-semibold text-sm transition-colors ${
                  ice?.menuitemid === option.menuitemid
                    ? highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'
                    : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText(option.name)}
                {parseFloat(option.price) > 0 && <div className="text-xs">+${parseFloat(option.price).toFixed(2)}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold mb-2 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Toppings')} ({getTranslatedText('Select Multiple')})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {toppingOptions.map((topping) => {
              const isSelected = toppings.find((t) => t.menuitemid === topping.menuitemid);
              return (
                <button
                  key={topping.menuitemid}
                  onClick={() => toggleTopping(topping)}
                  className={`p-3 rounded-lg font-semibold text-sm transition-colors text-left ${
                    isSelected
                      ? highContrast ? 'bg-yellow-400 text-black' : 'bg-purple-600 text-white'
                      : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{getTranslatedText(topping.name)}</span>
                    <span className="text-xs">+${parseFloat(topping.price).toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Total and Add Button */}
        <div className={`pt-4 ${highContrast ? 'border-t-2 border-yellow-400' : 'border-t border-gray-200'}`}>
          <div className={`flex justify-between items-center mb-3 ${
            highContrast ? 'text-yellow-400' : 'text-gray-800'
          }`}>
            <span className="text-lg font-semibold">{getTranslatedText('Total')}:</span>
            <span className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-green-600'}`}>
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className={`w-full py-4 rounded-lg text-lg font-bold transition-colors ${
              highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {getTranslatedText('Add to Cart')}
          </button>
        </div>
      </div>
    </div>
  );
}
