import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import WeatherWidget from './components/WeatherWidget';
import CustomerAuthModal from './components/modals/CustomerAuthModal';
import CartView from './components/views/CartView';
import AddMoreItemsModal from './components/modals/AddMoreItemsModal';
import PaymentModal from './components/modals/PaymentModal';
import ThankYouScreen from './components/views/ThankYouScreen';
import VoiceAssistant from './components/VoiceAssistant';
import { API_ENDPOINTS, API_BASE_URL } from './config/api';
import { translateText, translateBatch } from './utils/translation';

// Customization Modal
function CustomizationModal({ drink, onClose, onAddToCart, sweetnessOptions, iceOptions, sizeOptions, toppingOptions, getTranslatedText, highContrast }) {
  // Set default to first option from each category
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
      style={{ backgroundColor: highContrast ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)' }} 
      onClick={onClose}
    >
      <div className={`rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${
        highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
      }`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className={`text-3xl font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
              {getTranslatedText(drink.name)}
            </h2>
            <p className={`text-lg ${highContrast ? 'text-white' : 'text-gray-600'}`}>
              ${parseFloat(drink.price).toFixed(2)}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className={`text-2xl ${highContrast ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-700'}`}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            ✕
          </button>
        </div>

        {/* Size Selection */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Size')}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {sizeOptions.map((option) => (
              <button
                key={option.menuitemid}
                onClick={() => setSize(option)}
                className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                  size?.menuitemid === option.menuitemid
                    ? highContrast ? 'bg-yellow-400 text-black border-2 border-yellow-400' : 'bg-orange-600 text-white'
                    : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ minHeight: '44px' }}
              >
                {getTranslatedText(option.name)}
                {parseFloat(option.price) > 0 && ` (+$${parseFloat(option.price).toFixed(2)})`}
              </button>
            ))}
          </div>
        </div>

        {/* Sweetness Level */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Sweetness Level')}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {sweetnessOptions.map((option) => (
              <button
                key={option.menuitemid}
                onClick={() => setSweetness(option)}
                className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                  sweetness?.menuitemid === option.menuitemid
                    ? highContrast ? 'bg-yellow-400 text-black border-2 border-yellow-400' : 'bg-green-600 text-white'
                    : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ minHeight: '44px' }}
              >
                {getTranslatedText(option.name)}
                {parseFloat(option.price) > 0 && ` (+$${parseFloat(option.price).toFixed(2)})`}
              </button>
            ))}
          </div>
        </div>

        {/* Ice Level */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Ice Level')}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {iceOptions.map((option) => (
              <button
                key={option.menuitemid}
                onClick={() => setIce(option)}
                className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                  ice?.menuitemid === option.menuitemid
                    ? highContrast ? 'bg-yellow-400 text-black border-2 border-yellow-400' : 'bg-blue-600 text-white'
                    : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ minHeight: '44px' }}
              >
                {getTranslatedText(option.name)}
                {parseFloat(option.price) > 0 && ` (+$${parseFloat(option.price).toFixed(2)})`}
              </button>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Toppings')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {toppingOptions.map((topping) => {
              const isSelected = toppings.find((t) => t.menuitemid === topping.menuitemid);
              return (
                <button
                  key={topping.menuitemid}
                  onClick={() => toggleTopping(topping)}
                  className={`p-4 rounded-lg font-semibold transition-colors text-left ${
                    isSelected
                      ? highContrast ? 'bg-yellow-400 text-black border-2 border-yellow-400' : 'bg-purple-600 text-white'
                      : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ minHeight: '50px' }}
                >
                  <div className="flex justify-between items-center">
                    <span>{getTranslatedText(topping.name)}</span>
                    <span className="text-sm">+${parseFloat(topping.price).toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className={`pt-6 ${highContrast ? 'border-t-4 border-yellow-400' : 'border-t border-gray-200'}`}>
          <div className={`flex justify-between items-center mb-4 ${
            highContrast ? 'text-yellow-400' : 'text-gray-800'
          }`}>
            <span className="text-xl font-semibold">{getTranslatedText('Total')}:</span>
            <span className={`text-2xl font-bold ${highContrast ? 'text-white' : 'text-green-600'}`}>
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className={`w-full py-5 rounded-lg text-lg font-bold shadow-lg transition-colors ${
              highContrast
                ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            style={{ minHeight: '60px' }}
          >
            {getTranslatedText('Add to Cart')}
          </button>
        </div>
      </div>
    </div>
  );
}

// A single drink item in the grid
function DrinkCard({ drink, onDrinkClick, getTranslatedText, highContrast }) {
  // Database returns 'name' and 'price' as lowercase
  return (
    <div
      className={`flex flex-col items-center justify-between p-6 rounded-lg shadow-lg cursor-pointer transition-all transform hover:scale-105 ${
        highContrast 
          ? 'bg-gray-900 border-4 border-yellow-400 hover:border-yellow-300' 
          : 'bg-white hover:shadow-xl'
      }`}
      onClick={() => onDrinkClick(drink)}
      style={{ minHeight: '200px' }}
    >
      <div className={`w-28 h-28 rounded-full mb-4 flex items-center justify-center ${
        highContrast ? 'bg-gray-800' : 'bg-gray-200'
      }`}>
        <span className="text-5xl">🥤</span>
      </div>
      <span className={`text-center font-semibold mb-2 ${
        highContrast ? 'text-yellow-400' : 'text-gray-800'
      }`}>
        {getTranslatedText(drink.name)}
      </span>
      {/* Database returns 'price' as lowercase */}
      <span className={`text-xl font-bold ${
        highContrast ? 'text-white' : 'text-green-600'
      }`}>
        ${parseFloat(drink.price).toFixed(2)}
      </span>
    </div>
  );
}

// The sidebar showing the cart
function Cart({ cartItems, total, highContrast, getTranslatedText, onPay, largeClickTargets, onRemoveItem, onIncreaseQuantity, onDecreaseQuantity }) {
  const getButtonSizeClass = () => {
    return largeClickTargets
      ? 'min-h-[80px] px-8 py-6 text-xl'
      : 'min-h-[60px] px-6 py-4 text-lg';
  };

  return (
    <div className={`w-1/4 p-6 shadow-lg rounded-lg ${
      highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
    }`}>
      <h2 className={`font-bold mb-6 text-center ${
        highContrast ? 'text-yellow-400' : 'text-gray-800'
      }`} style={{fontSize: '1.5rem'}}>{getTranslatedText('View Cart')}</h2>
      <div className="flex-grow overflow-y-auto mb-4" style={{maxHeight: '60vh'}}>
        {cartItems.length === 0 ? (
          <p className={`text-center ${highContrast ? 'text-white' : 'text-gray-500'}`}>{getTranslatedText('Your cart is empty.')}</p>
        ) : (
          cartItems.map((item, index) => (
            <div
              key={`${item.menuitemid}-${index}`}
              className={`flex justify-between items-start mb-4 pb-4 ${
                highContrast ? 'border-b-2 border-yellow-400' : 'border-b border-gray-200'
              }`}
            >
              <div className="flex-1">
                <span className={`font-semibold block ${
                  highContrast ? 'text-yellow-400' : 'text-gray-800'
                }`} style={{fontSize: '1.125rem'}}>{getTranslatedText(item.name)}</span>
                {item.customizations && (
                  <div className={`mt-1 ${
                    highContrast ? 'text-white' : 'text-gray-500'
                  }`}>
                    <div>{getTranslatedText('Sweetness:')} {getTranslatedText(item.customizations.sweetness)}</div>
                    <div>{getTranslatedText('Ice:')} {getTranslatedText(item.customizations.ice)}</div>
                    {item.customizations.toppings.length > 0 && (
                      <div>{getTranslatedText('Toppings:')} {item.customizations.toppings.map(t => getTranslatedText(t)).join(', ')}</div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-0.5 mt-1">
                  <button
                    onClick={() => onDecreaseQuantity(index)}
                    className={`h-5 w-5 rounded text-xs font-bold leading-none transition-colors ${
                      highContrast
                        ? 'bg-gray-700 text-yellow-400 border border-yellow-400 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className={`min-w-[25px] text-center ${
                    highContrast ? 'text-white' : 'text-gray-800'
                  }`} style={{fontSize: '0.75rem'}}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onIncreaseQuantity(index)}
                    className={`h-5 w-5 rounded text-xs font-bold leading-none transition-colors ${
                      highContrast
                        ? 'bg-gray-700 text-yellow-400 border border-yellow-400 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <span className={`ml-1 ${
                    highContrast ? 'text-gray-300' : 'text-gray-500'
                  }`} style={{fontSize: '0.75rem'}}>
                    × ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end ml-1">
                <span className={`font-bold mb-1 ${
                  highContrast ? 'text-white' : 'text-gray-800'
                }`} style={{fontSize: '0.875rem'}}>
                  ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                </span>
                <button
                  onClick={() => onRemoveItem(index)}
                  className={`h-7 w-7 rounded text-sm font-semibold leading-none transition-colors ${
                    highContrast
                      ? 'bg-red-700 text-white border border-yellow-400 hover:bg-red-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className={`pt-6 ${
        highContrast ? 'border-t-4 border-yellow-400' : 'border-t border-gray-200'
      }`}>
        <div className={`flex justify-between items-center font-bold mb-6 ${
          highContrast ? 'text-yellow-400' : 'text-gray-800'
        }`} style={{fontSize: '1.5rem'}}>
          <span>{getTranslatedText('Total')}</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button 
          onClick={onPay}
          disabled={cartItems.length === 0}
          className={`w-full rounded-lg font-bold shadow-lg transition-colors ${getButtonSizeClass()} ${
            cartItems.length === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : highContrast 
                ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300' 
                : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {getTranslatedText('Pay')} ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

// The main Kiosk component
export default function Kiosk({ role = 'customer' }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [toppings, setToppings] = useState([]);
  const [sweetnessOptions, setSweetnessOptions] = useState([]);
  const [iceOptions, setIceOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedData, setTranslatedData] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [forceRender, setForceRender] = useState(0); // Force re-render counter
  
  // Accessibility states for Carol (vision impairment, tremor)
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [largeClickTargets, setLargeClickTargets] = useState(false);

  // Customer authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customer, setCustomer] = useState(null);

  // Weather state for recommendations
  const [currentWeather, setCurrentWeather] = useState(null);
  const [authPromptShown, setAuthPromptShown] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout flow states
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'cart', 'thankYou'
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState(null);
  const [selectedRewards, setSelectedRewards] = useState([]); // Track selected rewards

  // Get weather-based drink recommendation
  const getWeatherRecommendation = () => {
    console.log('🌤️ Getting weather recommendation...', { 
      hasWeather: !!currentWeather, 
      hasDrinks: !!drinks, 
      drinksCount: drinks?.length 
    });
    
    if (!currentWeather || !drinks || drinks.length === 0) {
      console.log('❌ No weather recommendation: missing data', {
        currentWeather,
        drinksLength: drinks?.length
      });
      return null;
    }

    const temp = currentWeather.temp_f;
    const condition = currentWeather.condition.text.toLowerCase();
    
    console.log('🌡️ Weather data:', { temp, condition });

    // Very cold weather (below 50°F) - recommend hot drinks
    if (temp < 50) {
      const hotDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('hot') || 
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('coffee') ||
        d.name.toLowerCase().includes('matcha')
      );
      if (hotDrinks.length > 0) {
        const randomDrink = hotDrinks[Math.floor(Math.random() * hotDrinks.length)];
        return {
          icon: '🔥',
          messageParts: ["It's chilly at", `${Math.round(temp)}°F`, "-", "warm up with a"],
          drink: randomDrink
        };
      }
    }
    
    // Cold weather (50-65°F) - recommend warm or mild drinks
    if (temp >= 50 && temp < 65) {
      const mildDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('taro') ||
        d.name.toLowerCase().includes('matcha') ||
        d.name.toLowerCase().includes('classic')
      );
      if (mildDrinks.length > 0) {
        const randomDrink = mildDrinks[Math.floor(Math.random() * mildDrinks.length)];
        return {
          icon: '☕',
          messageParts: ["Perfect weather at", `${Math.round(temp)}°F`, "for a"],
          drink: randomDrink
        };
      }
    }
    
    // Hot weather (above 80°F) - recommend cold/iced drinks
    if (temp > 80) {
      const coldDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('ice') || 
        d.name.toLowerCase().includes('smoothie') ||
        d.name.toLowerCase().includes('slush') ||
        d.name.toLowerCase().includes('fruit')
      );
      if (coldDrinks.length > 0) {
        const randomDrink = coldDrinks[Math.floor(Math.random() * coldDrinks.length)];
        return {
          icon: '🧊',
          messageParts: ["Beat the heat at", `${Math.round(temp)}°F`, "with a refreshing"],
          drink: randomDrink
        };
      }
    }

    // Rainy/stormy weather - recommend comfort drinks
    if (condition.includes('rain') || condition.includes('storm') || condition.includes('drizzle') || condition.includes('shower')) {
      const comfortDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('matcha') ||
        d.name.toLowerCase().includes('taro') ||
        d.name.toLowerCase().includes('coffee')
      );
      if (comfortDrinks.length > 0) {
        const randomDrink = comfortDrinks[Math.floor(Math.random() * comfortDrinks.length)];
        return {
          icon: '☔',
          messageParts: ["Perfect rainy day for a cozy"],
          drink: randomDrink
        };
      }
    }

    // Foggy/misty/cloudy weather - recommend comforting drinks
    if (condition.includes('fog') || condition.includes('mist') || condition.includes('overcast') || condition.includes('cloudy')) {
      const comfortDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('taro') ||
        d.name.toLowerCase().includes('classic') ||
        d.name.toLowerCase().includes('brown sugar')
      );
      if (comfortDrinks.length > 0) {
        const randomDrink = comfortDrinks[Math.floor(Math.random() * comfortDrinks.length)];
        return {
          icon: '🌫️',
          messageParts: ["Cozy up on this", condition, "day with a"],
          drink: randomDrink
        };
      }
    }

    // Snowy/icy weather - recommend hot drinks
    if (condition.includes('snow') || condition.includes('ice') || condition.includes('sleet') || condition.includes('blizzard')) {
      const hotDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('hot') ||
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('coffee')
      );
      if (hotDrinks.length > 0) {
        const randomDrink = hotDrinks[Math.floor(Math.random() * hotDrinks.length)];
        return {
          icon: '❄️',
          messageParts: ["Stay warm in this", condition, "with a hot"],
          drink: randomDrink
        };
      }
    }

    // Sunny/clear weather - recommend refreshing drinks
    if (condition.includes('sunny') || condition.includes('clear')) {
      const refreshingDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('fruit') ||
        d.name.toLowerCase().includes('lemon') ||
        d.name.toLowerCase().includes('green tea') ||
        d.name.toLowerCase().includes('peach')
      );
      if (refreshingDrinks.length > 0) {
        const randomDrink = refreshingDrinks[Math.floor(Math.random() * refreshingDrinks.length)];
        return {
          icon: '☀️',
          messageParts: ["Sunny and", `${Math.round(temp)}°F`, "-", "try a refreshing"],
          drink: randomDrink
        };
      }
    }

    // Partly cloudy - recommend popular drinks
    if (condition.includes('partly') || condition.includes('scattered')) {
      const popularDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('fruit tea') ||
        d.name.toLowerCase().includes('classic')
      );
      if (popularDrinks.length > 0) {
        const randomDrink = popularDrinks[Math.floor(Math.random() * popularDrinks.length)];
        return {
          icon: '⛅',
          messageParts: ["Nice day at", `${Math.round(temp)}°F`, "for a"],
          drink: randomDrink
        };
      }
    }

    // Default fallback - recommend based on temperature if no specific condition matched
    if (temp > 75) {
      // Warm/hot - recommend cold drinks
      const coldDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('fruit') ||
        d.name.toLowerCase().includes('tea') ||
        d.name.toLowerCase().includes('smoothie')
      );
      if (coldDrinks.length > 0) {
        const randomDrink = coldDrinks[Math.floor(Math.random() * coldDrinks.length)];
        return {
          icon: '🍹',
          messageParts: ["Perfect weather at", `${Math.round(temp)}°F`, "for a"],
          drink: randomDrink
        };
      }
    } else {
      // Cool/moderate - recommend any popular drink
      const popularDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('classic') ||
        d.name.toLowerCase().includes('taro')
      );
      if (popularDrinks.length > 0) {
        const randomDrink = popularDrinks[Math.floor(Math.random() * popularDrinks.length)];
        return {
          icon: '🥤',
          messageParts: ["Nice day at", `${Math.round(temp)}°F`, "for a"],
          drink: randomDrink
        };
      }
    }

    // Ultimate fallback - just pick any random drink
    if (drinks.length > 0) {
      const randomDrink = drinks[Math.floor(Math.random() * drinks.length)];
      return {
        icon: '✨',
        messageParts: ["try a refreshing"],
        drink: randomDrink
      };
    }

    return null;
  };

  const weatherRecommendation = useMemo(() => getWeatherRecommendation(), [currentWeather, drinks]);

  // Get font size scale (improved for Carol's macular degeneration)
  const getFontSizeScale = () => {
    switch(fontSize) {
      case 'large': return 'text-xl';
      case 'extra-large': return 'text-2xl';
      default: return 'text-lg'; // Default slightly larger for readability
    }
  };

  // Get heading size class based on accessibility settings
  const getHeadingSizeClass = (level) => {
    if (fontSize === 'large') {
      switch(level) {
        case 'h1': return 'text-5xl';
        case 'h2': return 'text-3xl';
        case 'h3': return 'text-2xl';
        default: return 'text-xl';
      }
    } else if (fontSize === 'extra-large') {
      switch(level) {
        case 'h1': return 'text-6xl';
        case 'h2': return 'text-4xl';
        case 'h3': return 'text-3xl';
        default: return 'text-2xl';
      }
    } else {
      switch(level) {
        case 'h1': return 'text-4xl';
        case 'h2': return 'text-2xl';
        case 'h3': return 'text-xl';
        default: return 'text-lg';
      }
    }
  };

  // Get button size class (for Carol's tremor)
  const getButtonSizeClass = () => {
    return largeClickTargets ? 'min-h-[80px] px-8 py-6 text-xl' : 'min-h-[60px] px-6 py-4 text-lg';
  };

  // Get container class with accessibility settings
  const getContainerClass = () => {
    const baseClass = 'flex flex-col w-full min-h-screen font-sans';
    const bgClass = highContrast ? 'bg-black' : 'bg-lime-50';
    return `${baseClass} ${bgClass} ${getFontSizeScale()}`;
  };

  // --- Data Fetching ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.menu);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // The backend sends { categories: [], menu_items: [], toppings: [], sweetness_options: [], ice_options: [] }
        // The categories are objects like { category: 'Milky Series' }
        const categoryNames = data.categories.map(cat => cat.category);
        
        // Add "All Drinks" as the first category
        const allCategories = ['All Drinks', ...categoryNames];
        
        setCategories(allCategories);
        setDrinks(data.menu_items);
        setToppings(data.toppings || []);
        setSweetnessOptions(data.sweetness_options || []);
        setIceOptions(data.ice_options || []);
        setSizeOptions(data.size_options || []);
        
        // Set the default selected category to "All Drinks"
        if (allCategories.length > 0) {
          setSelectedCategory(allCategories[0]);
        }
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch menu:", err);
        
        // Show helpful message in production
        if (import.meta.env.PROD) {
          setError("Backend not available. The backend needs to be deployed separately. See DEPLOYMENT.md for instructions.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Show customer auth modal for customer role only, once per session
  useEffect(() => {
    if (role === 'customer' && !authPromptShown && !isLoading) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowAuthModal(true);
        setAuthPromptShown(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [role, authPromptShown, isLoading]);

  // Handle successful authentication
  const handleAuthenticated = (customerData) => {
    setCustomer(customerData);
    setShowAuthModal(false);
    console.log('Customer authenticated:', customerData);
  };

  // Handle guest continuation or logout
  const handleGuest = () => {
    if (customer) {
      // If logged in, log them out
      setCustomer(null);
      console.log('Customer logged out');
    } else {
      console.log('Continuing as guest');
    }
    setShowAuthModal(false);
  };

  // Handle logout from switch button
  const handleSwitchAccount = () => {
    setShowAuthModal(true);
  };

  // Filter drinks based on the selected category and search query
  const visibleDrinks = useMemo(() => {
    let filteredDrinks = drinks;

    // Filter by category
    if (selectedCategory === 'All Drinks') {
      // Show all items where type = 'Drink' but exclude Miscellaneous category
      filteredDrinks = drinks.filter((d) => 
        d.type === 'Drink' && d.category !== 'Miscellaneous'
      );
    } else if (selectedCategory === 'Miscellaneous') {
      // Show Miscellaneous items regardless of type
      filteredDrinks = drinks.filter((d) => 
        d.category === 'Miscellaneous'
      );
    } else {
      // Filter by selected category and ensure it's a Drink type
      filteredDrinks = drinks.filter((d) => 
        d.category === selectedCategory && d.type === 'Drink'
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDrinks = filteredDrinks.filter((d) => 
        d.name.toLowerCase().includes(query)
      );
    }

    return filteredDrinks;
  }, [selectedCategory, drinks, searchQuery]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  }, [cart]);

  // Open customization modal when drink is clicked
  const handleDrinkClick = (drink) => {
    setSelectedDrink(drink);
  };

  // Handle language change with batch translation
  const handleLanguageChange = async (lang) => {
    console.log('🌍 Language change requested:', lang);
    
    if (lang === 'en') {
      setSelectedLanguage('en');
      setTranslatedData({});
      return;
    }

    setIsTranslating(true);

    try {
      // First, try to fetch from database (fast!)
      const dbUrl = `${API_BASE_URL}/api/translations/${lang}`;
      console.log('📡 Fetching translations from:', dbUrl);
      
      const dbResponse = await fetch(dbUrl);
      
      if (!dbResponse.ok) {
        throw new Error(`Database fetch failed: ${dbResponse.status} ${dbResponse.statusText}`);
      }
      
      const dbData = await dbResponse.json();
      const { translations, count } = dbData;
      
      if (count > 0) {
        console.log(`✅ Loaded ${count} translations from database`);
        setTranslatedData(translations);
        setSelectedLanguage(lang);
        setForceRender(prev => prev + 1);
        setIsTranslating(false);
        return;
      }

      // If no translations in DB, populate them (first-time setup)
      console.log(`📝 No translations found, populating database for ${lang}...`);
      
      const staticLabels = [
        // Original labels
        'Sweetness Level', 'Ice Level', 'Size', 'Toppings', 'Total', 'Add to Cart',
        'View Cart', 'Your cart is empty.', 'Sweetness:', 'Ice:', 'Size:', 'Toppings:', 
        'Pay', 'Menu', 'Kiosk System', 'Accessibility:', 'Text Size:', 
        'Normal', 'Large', 'Extra Large', 'High Contrast', 'Language:',
        
        // Sweetness/Ice/Size options (modification values)
        'Regular', 'Less', 'No Ice', 'Small', 'Medium', 'Extra Large',
        'Normal (100%)', 'Less (75%)', 'Half (50%)', 'Light (25%)', 'No Sugar (0%)', 'Extra Sugar (125%)',
        
        // Cart View labels
        'Back to Menu', 'Your Cart', 'Your cart is empty', 'Add some drinks to get started!',
        'Browse Menu', 'Quantity', 'each', 'Rewards', 'points', 'Redeem your points for rewards!',
        'Free Drink', 'Get any drink for free', 'Free Topping', 'Add a free topping to any drink',
        '20% Off', '20% off your entire order', 'Buy One Get One', 'Get the cheapest drink free',
        'Not enough points', 'Subtotal', 'Rewards Savings', 'Proceed to Checkout',
        
        // Customer Auth Modal labels
        'Log In', 'Sign Up', 'Skip', 'Continue as Guest', 'Earn Rewards!',
        'Sign up or log in to earn points with every purchase',
        'Phone Number', 'Enter your phone number', 'PIN', 'Enter PIN',
        'Full Name', 'Enter your name', 'Create 4-Digit PIN', 'Confirm PIN',
        'Create Account', 'Join our rewards program!',
        'Back', '4-Digit PIN', 'Phone', 'Checking...', 'Continue',
        "Don't have an account?", 'Already have an account?',
        'Logging In...', 'Creating Account...', 'Setting PIN...', 'Set PIN & Continue',
        'Switch Account', 'Currently logged in as:', 
        'Log In to Different Account', 'Create New Account', 'Log Out (Continue as Guest)',
        'Logging out will remove your rewards tracking for this session',
        'Log In to Account', 'You can always sign up later to start earning rewards!',
        'Set Up Your PIN', 'Your account was created by a cashier. Please set up a 4-digit PIN to secure your account.',
        
        // Error messages
        'Please enter a valid 10-digit phone number',
        'Phone number not found. Please sign up or try a different number.',
        'Unable to connect to server. Please try again.',
        'PIN must be 4 digits', 'Incorrect PIN. Please try again.',
        'PIN must be exactly 4 digits', 'PINs do not match',
        'Failed to set PIN. Please try again.',
        'Please enter your name', 'Signup failed. Please try again.',
        
        // Payment Modal labels
        'Select Payment Method', 'Cash', 'Credit Card', 'Debit Card', 'Cancel',
        'Customer', 'Points Remaining', 'Available Rewards', 'Applied', 'Total Discount',
        'New Total', 'Card', 'Credit or Debit', 'Pay at counter',
        
        // Add More Items Modal labels
        'Want to add more?', 'Add to Order', 'Add More Items?', 'Check out these popular drinks!',
        'Continue to Checkout',
        
        // Thank You Screen labels
        'Thank You', 'Your order has been placed successfully!', 'Order Number',
        'Please wait for your order to be prepared', 'Place New Order',
        
        // Weather recommendation templates (will be dynamically formatted)
        "It's chilly at", "warm up with a", "Perfect weather at", "for a",
        "Beat the heat at", "with a refreshing", "Perfect rainy day for a cozy",
        "Cozy up on this", "day with a", "Stay warm in this", "with a hot",
        "Sunny and", "try a refreshing", "Nice day at",
        
        // Weather conditions (for dynamic translation)
        'rainy', 'foggy', 'cloudy', 'overcast', 'sunny', 'clear', 'partly cloudy',
        
        // Temperature units
        '°F',
        
        // Search and Navigation
        'Search drinks...', 'Clear search', 'ShareNook Kiosk'
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

      // Populate database (this uses MyMemory API)
      const populateUrl = `${API_BASE_URL}/api/translations/populate`;
      console.log('📡 Populating translations at:', populateUrl);
      
      const populateResponse = await fetch(populateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: allTexts, targetLang: lang })
      });

      if (!populateResponse.ok) {
        throw new Error(`Populate failed: ${populateResponse.status} ${populateResponse.statusText}`);
      }

      const result = await populateResponse.json();
      console.log(`✅ Populated ${result.newTranslations} new translations`);
      
      // Now fetch from database
      const fetchResponse = await fetch(dbUrl);
      const fetchData = await fetchResponse.json();
      
      setTranslatedData(fetchData.translations);
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

  // Get translated text helper - memoized to ensure it updates when dependencies change
  const getTranslatedText = useMemo(() => {
    return (text) => {
      if (!text) return text;
      if (selectedLanguage === 'en') return text;
      
      // Database stores translations directly by text key
      const translation = translatedData[text];
      
      return translation || text;
    };
  }, [selectedLanguage, translatedData, forceRender]); // Include forceRender to ensure updates

  // Add a customized drink to the cart
  const handleAddToCart = (customizedDrink) => {
    setCart((prevCart) => {
      // Create a unique key based on drink and customizations (including size)
      const customizationKey = customizedDrink.customizations
        ? `${customizedDrink.menuitemid}-${customizedDrink.customizations.size}-${customizedDrink.customizations.sweetness}-${customizedDrink.customizations.ice}-${customizedDrink.customizations.toppings.join(',')}`
        : customizedDrink.menuitemid;
      
      // Check if exact same item with same customizations exists
      const existingItem = prevCart.find((item) => {
        const itemKey = item.customizations
          ? `${item.menuitemid}-${item.customizations.size}-${item.customizations.sweetness}-${item.customizations.ice}-${item.customizations.toppings.join(',')}`
          : item.menuitemid;
        return itemKey === customizationKey;
      });

      if (existingItem) {
        return prevCart.map((item) => {
          const itemKey = item.customizations
            ? `${item.menuitemid}-${item.customizations.size}-${item.customizations.sweetness}-${item.customizations.ice}-${item.customizations.toppings.join(',')}`
            : item.menuitemid;
          return itemKey === customizationKey
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      } else {
        return [...prevCart, { ...customizedDrink, quantity: 1 }];
      }
    });
  };

  // Remove an item from the cart by index
  const handleRemoveItem = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  // Increase quantity of an item in the cart
  const handleIncreaseQuantity = (index) => {
    setCart((prevCart) => prevCart.map((item, i) => 
      i === index ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Decrease quantity of an item in the cart (remove if quantity becomes 0)
  const handleDecreaseQuantity = (index) => {
    setCart((prevCart) => {
      const item = prevCart[index];
      if (item.quantity === 1) {
        // Remove item if quantity is 1
        return prevCart.filter((_, i) => i !== index);
      }
      return prevCart.map((item, i) => 
        i === index ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  // Handle Pay button click - navigate to cart view
  const handlePayClick = () => {
    if (cart.length === 0) return;
    setCurrentView('cart');
  };

  // Handle back to menu from cart view
  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  // Handle checkout button from cart view - show upsell modal
  const handleCheckoutClick = () => {
    // Get 3 random drinks not in cart
    const drinksInCart = new Set(cart.map(item => item.menuitemid));
    const availableDrinks = drinks.filter(d => 
      d.type === 'Drink' && 
      !drinksInCart.has(d.menuitemid)
    );
    
    // If all drinks are in cart, just show any 3 drinks
    const drinksToShow = availableDrinks.length >= 3 
      ? availableDrinks.slice(0, 3)
      : drinks.filter(d => d.type === 'Drink').slice(0, 3);
    
    // Shuffle and take 3
    const shuffled = [...drinksToShow].sort(() => 0.5 - Math.random());
    const recommendedDrinks = shuffled.slice(0, 3);
    
    setRecommendedDrinks(recommendedDrinks);
    setShowAddMoreModal(true);
  };

  // State for recommended drinks
  const [recommendedDrinks, setRecommendedDrinks] = useState([]);

  // Calculate reward discount and final total
  const calculateFinalTotal = () => {
    const rewards = [
      {
        id: 'free_drink',
        pointsCost: 100,
        discount: (items) => {
          const mostExpensive = items.reduce((max, item) => 
            parseFloat(item.price) > parseFloat(max.price) ? item : max
          , items[0]);
          return mostExpensive ? parseFloat(mostExpensive.price) : 0;
        }
      },
      {
        id: 'free_topping',
        pointsCost: 50,
        discount: 0.75
      },
      {
        id: 'discount_20',
        pointsCost: 150,
        discount: (items, total) => total * 0.20
      },
      {
        id: 'bogo',
        pointsCost: 75,
        discount: (items) => {
          const cheapest = items.reduce((min, item) => 
            parseFloat(item.price) < parseFloat(min.price) ? item : min
          , items[0]);
          return cheapest ? parseFloat(cheapest.price) : 0;
        }
      }
    ];

    let totalDiscount = 0;
    let totalPointsCost = 0;
    
    selectedRewards.forEach(rewardId => {
      const reward = rewards.find(r => r.id === rewardId);
      if (reward) {
        totalPointsCost += reward.pointsCost;
        if (typeof reward.discount === 'function') {
          totalDiscount += reward.discount(cart, cartTotal);
        } else {
          totalDiscount += reward.discount;
        }
      }
    });

    const finalTotal = Math.max(0, cartTotal - totalDiscount);
    
    return { finalTotal, totalDiscount, totalPointsCost };
  };

  // Handle adding drink from upsell modal
  const handleAddFromUpsell = (drink) => {
    setShowAddMoreModal(false);
    setSelectedDrink(drink);
  };

  // Handle continue to payment from upsell modal
  const handleContinueToPayment = () => {
    setShowAddMoreModal(false);
    setShowPaymentModal(true);
  };

  // Handle payment selection
  const handlePaymentSelect = async (paymentType) => {
    setShowPaymentModal(false);
    
    try {
      // Calculate final total with discounts
      const { finalTotal, totalDiscount, totalPointsCost } = calculateFinalTotal();
      
      // Submit order to backend
      const response = await fetch(API_ENDPOINTS.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          totalCost: finalTotal, // Send discounted total
          customerId: customer?.customerId || null,
          employeeId: user ? 1 : null,
          paymentType: paymentType,
          rewardsUsed: selectedRewards, // Send used rewards
          rewardDiscount: totalDiscount,
          pointsRedeemed: totalPointsCost
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Order successful
        setLastOrderNumber(data.orderId);
        setCart([]); // Clear cart
        setSelectedRewards([]); // Clear selected rewards
        setCurrentView('thankYou');
        
        // Update customer points if logged in
        if (customer) {
          const pointsEarned = Math.floor(finalTotal); // Points based on final total
          const pointsSpent = totalPointsCost;
          setCustomer(prev => ({
            ...prev,
            loyaltyPoints: prev.loyaltyPoints + pointsEarned - pointsSpent
          }));
        }
      } else {
        console.error('Order failed:', data.error);
        alert('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      alert('Failed to connect to server. Please try again.');
    }
  };

  // Handle new order from thank you screen
  const handleNewOrder = () => {
    setCurrentView('menu');
    setLastOrderNumber(null);
    setSelectedRewards([]); // Reset rewards for new order
  };

  // Handle reward toggle
  const handleRewardToggle = (rewardId) => {
    setSelectedRewards(prev => {
      if (prev.includes(rewardId)) {
        // Remove reward if already selected
        return prev.filter(id => id !== rewardId);
      } else {
        // Add reward
        return [...prev, rewardId];
      }
    });
  };

  // Accessibility Menu Component (reusable across all views)
  const AccessibilityMenu = () => (
    <div 
      key={`accessibility-${selectedLanguage}`}
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
          <h3 className={`font-semibold mb-3 ${getHeadingSizeClass('h3')} ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Text Size')} <span className="text-sm font-normal">({getTranslatedText('For easier reading')})</span>
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
          <h3 className={`font-semibold mb-3 ${getHeadingSizeClass('h3')} ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Display Mode')} <span className="text-sm font-normal">({getTranslatedText('For better visibility')})</span>
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
            {highContrast ? getTranslatedText('High Contrast ON') : getTranslatedText('Normal Mode')}
          </button>
        </div>

        {/* Large Click Targets for tremor */}
        <div className="mb-6">
          <h3 className={`font-semibold mb-3 ${getHeadingSizeClass('h3')} ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {getTranslatedText('Button Size')} <span className="text-sm font-normal">({getTranslatedText('Easier to press')})</span>
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
            {largeClickTargets ? getTranslatedText('Large Buttons') : getTranslatedText('Standard Buttons')}
          </button>
        </div>

        {/* Helpful Info */}
        <div className={`p-4 rounded-lg ${highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-blue-50 border-2 border-blue-200'}`}>
          <p className={`text-sm ${highContrast ? 'text-white' : 'text-gray-700'}`}>
            {getTranslatedText('These settings make the kiosk easier to use. Try different options to find what works best for you!')}
          </p>
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

  // --- Render Logic ---
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading menu...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  // Render different views based on currentView state
  if (currentView === 'thankYou') {
    return (
      <>
        <ThankYouScreen
          orderNumber={lastOrderNumber}
          customerName={customer?.name}
          onNewOrder={handleNewOrder}
          highContrast={highContrast}
          getTranslatedText={getTranslatedText}
        />
        
        {/* Accessibility Button - Available on all screens */}
        <button
          onClick={() => setShowAccessibilityMenu(true)}
          className={`fixed bottom-8 left-8 px-6 py-4 rounded-xl shadow-2xl transition-all font-semibold text-sm ${
            highContrast
              ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          style={{ zIndex: 50 }}
          title="Accessibility Options"
        >
          {getTranslatedText('Accessibility')}
        </button>

        {/* Accessibility Menu Modal */}
        {showAccessibilityMenu && (
          <AccessibilityMenu />
        )}
      </>
    );
  }

  if (currentView === 'cart') {
    return (
      <>
        <CartView
          cartItems={cart}
          total={cartTotal}
          onCheckout={handleCheckoutClick}
          onBack={handleBackToMenu}
          highContrast={highContrast}
          getTranslatedText={getTranslatedText}
          customer={customer}
          selectedRewards={selectedRewards}
          onRewardToggle={handleRewardToggle}
        />
        
        {/* Drink Customization Modal */}
        {selectedDrink && (
          <CustomizationModal
            drink={selectedDrink}
            onClose={() => setSelectedDrink(null)}
            onAddToCart={handleAddToCart}
            sweetnessOptions={sweetnessOptions}
            iceOptions={iceOptions}
            sizeOptions={sizeOptions}
            toppingOptions={toppings}
            getTranslatedText={getTranslatedText}
            highContrast={highContrast}
          />
        )}
        
        {/* Add More Items Modal */}
        {showAddMoreModal && (
          <AddMoreItemsModal
            recommendedDrinks={recommendedDrinks}
            onAddDrink={handleAddFromUpsell}
            onContinue={handleContinueToPayment}
            onClose={() => setShowAddMoreModal(false)}
            highContrast={highContrast}
            getTranslatedText={getTranslatedText}
          />
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <PaymentModal
            total={calculateFinalTotal().finalTotal}
            onPaymentSelect={handlePaymentSelect}
            onCancel={() => setShowPaymentModal(false)}
            highContrast={highContrast}
            getTranslatedText={getTranslatedText}
          />
        )}
        
        {/* Accessibility Button - Available on all screens */}
        <button
          onClick={() => setShowAccessibilityMenu(true)}
          className={`fixed bottom-8 left-8 px-6 py-4 rounded-xl shadow-2xl transition-all font-semibold text-sm ${
            highContrast
              ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          style={{ zIndex: 50 }}
          title="Accessibility Options"
        >
          {getTranslatedText('Accessibility')}
        </button>

        {/* Accessibility Menu Modal */}
        {showAccessibilityMenu && (
          <AccessibilityMenu />
        )}
      </>
    );
  }

  // Default: Menu View
  return (
    <div className={`customer-view ${getContainerClass()}`}>
      
      {/* Top Navigation Tabs */}
      <header className={`shadow-md ${highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-white border-b-2 border-gray-200'}`}>
        <div className="flex items-center justify-between px-8 py-6">
          {/* Left: Kiosk Title */}
          <div className="flex items-center gap-8">
            <h1 className={`font-bold ${getHeadingSizeClass('h1')} ${highContrast ? 'text-yellow-400' : 'text-green-700'}`}>
              {getTranslatedText('ShareNook')}
            </h1>
            
            {/* Role Badge (for staff) - should not appear for customers */}
            {role !== 'customer' && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                role === 'manager' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            )}

            {/* Customer Info or Log In button */}
            {role === 'customer' && (
              <div className="flex items-center gap-3">
                {customer ? (
                  // Show customer info and switch button when logged in
                  <>
                    <div className="text-left">
                      <div className={`text-sm font-semibold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
                        {customer.name}
                      </div>
                      <div className={`text-xs font-medium ${highContrast ? 'text-white' : 'text-green-600'}`}>
                        {customer.loyaltyPoints} {getTranslatedText('points')}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className={`rounded ${getButtonSizeClass()} ${
                        highContrast 
                          ? 'bg-gray-800 text-yellow-400 border border-yellow-400 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Switch Account"
                    >
                      {getTranslatedText('Switch')}
                    </button>
                  </>
                ) : (
                  // Show Log In button when in guest mode
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className={`rounded-lg font-semibold transition-colors ${getButtonSizeClass()} ${
                      highContrast
                        ? 'bg-yellow-400 text-black border-2 border-yellow-400 hover:bg-yellow-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {getTranslatedText('Log In / Rewards')}
                  </button>
                )}
              </div>
            )}

            {/* Staff User Profile */}
            {user && (
              <div className="flex items-center gap-3">
                <span className={`text-sm ${highContrast ? 'text-white' : 'text-gray-700'}`}>
                  {user.firstName || user.username}
                </span>
                <UserButton 
                  afterSignOutUrl={import.meta.env.BASE_URL}
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Right: Weather Widget and Language Selector */}
          <div className="flex items-center gap-6">
            {/* Weather Widget */}
            <WeatherWidget 
              highContrast={highContrast}
              onWeatherUpdate={setCurrentWeather}
            />

            {/* Language Selector */}
            <div className="flex items-center gap-3">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`px-4 py-3 rounded-lg border-2 font-medium focus:outline-none focus:ring-2 ${
                  highContrast
                    ? 'bg-black text-yellow-400 border-yellow-400 focus:ring-yellow-400'
                    : 'bg-white text-gray-800 border-gray-300 focus:ring-green-500'
                }`}
                style={{ minHeight: '48px', minWidth: '150px' }}
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
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${highContrast ? 'bg-yellow-400' : 'bg-green-600'}`}></div>
                  <span className={`text-sm ${highContrast ? 'text-yellow-400' : 'text-gray-500'}`}>{getTranslatedText('Translating...')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 p-8 gap-6 relative">
        {/* Weather Recommendation Banner */}
        {weatherRecommendation && (
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 z-10 ${
            highContrast 
              ? 'bg-yellow-400 text-black border-4 border-yellow-500' 
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl'
          } px-8 py-4 rounded-xl flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => handleDrinkClick(weatherRecommendation.drink)}
          >
            <span className="text-3xl">{weatherRecommendation.icon}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">
                {weatherRecommendation.messageParts.map((part, idx) => {
                  // Don't translate numbers with °F or standalone punctuation
                  if (part.includes('°F') || part === '-') {
                    return <span key={idx}>{part} </span>;
                  }
                  return <span key={idx}>{getTranslatedText(part)} </span>;
                })}
              </span>
              <span className="font-bold text-lg underline">{getTranslatedText(weatherRecommendation.drink.name)}</span>
            </div>
          </div>
        )}

        {/* Left-hand Category Navigation */}
        <nav className="w-1/5">
          <h2 className={`font-bold mb-6 ${getHeadingSizeClass('h2')} ${highContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
            {getTranslatedText('Menu')}
          </h2>
          
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={getTranslatedText('Search drinks...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-4 rounded-lg border-2 font-medium focus:outline-none focus:ring-2 ${
                highContrast
                  ? 'bg-black text-yellow-400 border-yellow-400 placeholder-yellow-600 focus:ring-yellow-400'
                  : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400 focus:ring-green-500'
              }`}
              style={{ minHeight: '56px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`mt-2 text-sm font-medium ${
                  highContrast ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {getTranslatedText('Clear search')}
              </button>
            )}
          </div>

          <ul className="space-y-3">
            {categories.map((categoryName) => (
              <li key={categoryName}>
                <button
                  onClick={() => setSelectedCategory(categoryName)}
                  className={`w-full text-left rounded-lg font-semibold transition-all ${getButtonSizeClass()} ${
                    selectedCategory === categoryName
                      ? highContrast 
                        ? 'bg-yellow-400 text-black border-4 border-yellow-400 shadow-lg' 
                        : 'bg-green-600 text-white shadow-md'
                      : highContrast 
                        ? 'bg-gray-900 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-800' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {getTranslatedText(categoryName)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Center Drink Grid */}
        <main className="w-3/5">
          {/* Search Results Info */}
          {searchQuery && (
            <div className={`mb-6 p-4 rounded-lg ${
              highContrast ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'
            }`}>
              <p className="font-medium">
                {visibleDrinks.length} {getTranslatedText('result(s) for')} "{searchQuery}"
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {visibleDrinks.map((drink) => (
              <DrinkCard
                key={drink.menuitemid}
                drink={drink}
                onDrinkClick={handleDrinkClick}
                getTranslatedText={getTranslatedText}
                highContrast={highContrast}
              />
            ))}
          </div>
        </main>

        {/* Right-hand Cart Sidebar */}
        <Cart 
          cartItems={cart} 
          total={cartTotal} 
          highContrast={highContrast} 
          getTranslatedText={getTranslatedText} 
          onPay={handlePayClick} 
          largeClickTargets={largeClickTargets}
          onRemoveItem={handleRemoveItem}
          onIncreaseQuantity={handleIncreaseQuantity}
          onDecreaseQuantity={handleDecreaseQuantity}
        />
      </div>

      {/* Customization Modal */}
      {selectedDrink && (
        <CustomizationModal
          drink={selectedDrink}
          onClose={() => setSelectedDrink(null)}
          onAddToCart={handleAddToCart}
          sweetnessOptions={sweetnessOptions}
          iceOptions={iceOptions}
          sizeOptions={sizeOptions}
          toppingOptions={toppings}
          getTranslatedText={getTranslatedText}
          highContrast={highContrast}
        />
      )}

      {/* Customer Authentication Modal */}
      {showAuthModal && role === 'customer' && (
        <CustomerAuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={handleAuthenticated}
          onGuest={handleGuest}
          currentCustomer={customer}
          getTranslatedText={getTranslatedText}
        />
      )}

      {/* Voice Assistant - Only on menu and cart views */}
      {role === 'customer' && (currentView === 'menu' || currentView === 'cart') && (
        <VoiceAssistant
          drinks={drinks}
          toppings={toppings}
          sweetnessOptions={sweetnessOptions}
          iceOptions={iceOptions}
          sizeOptions={sizeOptions}
          cart={cart}
          currentView={currentView}
          onNavigateToCart={handlePayClick}
          onAddToCart={handleAddToCart}
          onCheckout={handleCheckoutClick}
          highContrast={highContrast}
          getTranslatedText={getTranslatedText}
        />
      )}

      {/* Accessibility Button - Available on all screens */}
      <button
        onClick={() => setShowAccessibilityMenu(true)}
        className={`fixed bottom-8 left-8 px-6 py-4 rounded-xl shadow-2xl transition-all font-semibold text-sm ${
          highContrast
            ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
        style={{ zIndex: 50 }}
        title="Accessibility Options"
      >
        {getTranslatedText('Accessibility')}
      </button>

      {/* Accessibility Menu Modal */}
      {showAccessibilityMenu && (
        <AccessibilityMenu />
      )}

      {/* Customer Authentication Modal */}
      {showAuthModal && (
        <CustomerAuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={handleAuthenticated}
          onGuest={handleGuest}
          currentCustomer={customer}
          highContrast={highContrast}
          getTranslatedText={getTranslatedText}
        />
      )}
    </div>
  );
}