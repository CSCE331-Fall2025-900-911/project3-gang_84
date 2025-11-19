import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import WeatherWidget from './components/WeatherWidget';
import CustomerAuthModal from './components/modals/CustomerAuthModal';
import CartView from './components/views/CartView';
import AddMoreItemsModal from './components/modals/AddMoreItemsModal';
import PaymentModal from './components/modals/PaymentModal';
import ThankYouScreen from './components/views/ThankYouScreen';
import { API_ENDPOINTS } from './config/api';

// Customization Modal
function CustomizationModal({ drink, onClose, onAddToCart, sweetnessOptions, iceOptions, toppingOptions, getTranslatedText, highContrast }) {
  // Set default to first option from each category
  const [sweetness, setSweetness] = useState(sweetnessOptions[0]);
  const [ice, setIce] = useState(iceOptions[0]);
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
    return basePrice + toppingsPrice + sweetnessPrice + icePrice;
  };

  const handleAddToCart = () => {
    const customizedDrink = {
      ...drink,
      customizations: {
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
function Cart({ cartItems, total, highContrast, getTranslatedText, onPay, largeClickTargets }) {
  const getButtonSizeClass = () => {
    return largeClickTargets
      ? 'min-h-[80px] px-8 py-6 text-xl'
      : 'min-h-[60px] px-6 py-4 text-lg';
  };

  return (
    <div className={`w-1/4 p-6 shadow-lg rounded-lg ${
      highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
    }`}>
      <h2 className={`text-2xl font-bold mb-6 text-center ${
        highContrast ? 'text-yellow-400' : 'text-gray-800'
      }`}>{getTranslatedText('View Cart')}</h2>
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
                <span className={`font-semibold block text-lg ${
                  highContrast ? 'text-yellow-400' : 'text-gray-800'
                }`}>{getTranslatedText(item.name)}</span>
                {item.customizations && (
                  <div className={`text-sm mt-1 ${
                    highContrast ? 'text-white' : 'text-gray-500'
                  }`}>
                    <div>{getTranslatedText('Sweetness:')} {getTranslatedText(item.customizations.sweetness)}</div>
                    <div>{getTranslatedText('Ice:')} {getTranslatedText(item.customizations.ice)}</div>
                    {item.customizations.toppings.length > 0 && (
                      <div>{getTranslatedText('Toppings:')} {item.customizations.toppings.map(t => getTranslatedText(t)).join(', ')}</div>
                    )}
                  </div>
                )}
                <span className={`text-sm block mt-1 ${
                  highContrast ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {item.quantity} x ${parseFloat(item.price).toFixed(2)}
                </span>
              </div>
              <span className={`font-bold ml-2 text-lg ${
                highContrast ? 'text-white' : 'text-gray-800'
              }`}>
                ${(item.quantity * parseFloat(item.price)).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
      
      <div className={`pt-6 ${
        highContrast ? 'border-t-4 border-yellow-400' : 'border-t border-gray-200'
      }`}>
        <div className={`flex justify-between items-center text-2xl font-bold mb-6 ${
          highContrast ? 'text-yellow-400' : 'text-gray-800'
        }`}>
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
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedData, setTranslatedData] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Accessibility states for Carol (vision impairment, tremor)
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
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
    if (!currentWeather) return null;

    const temp = currentWeather.temp_f;
    const condition = currentWeather.condition.text.toLowerCase();

    // Cold weather (below 60°F) - recommend hot drinks
    if (temp < 60) {
      const hotDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('hot') || 
        d.name.toLowerCase().includes('milk tea')
      );
      if (hotDrinks.length > 0) {
        const randomDrink = hotDrinks[Math.floor(Math.random() * hotDrinks.length)];
        return {
          icon: '🔥',
          message: `It's ${Math.round(temp)}°F outside - warm up with a`,
          drink: randomDrink
        };
      }
    }
    
    // Hot weather (above 80°F) - recommend cold/iced drinks
    if (temp > 80) {
      const coldDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('ice') || 
        d.name.toLowerCase().includes('smoothie') ||
        d.name.toLowerCase().includes('slush')
      );
      if (coldDrinks.length > 0) {
        const randomDrink = coldDrinks[Math.floor(Math.random() * coldDrinks.length)];
        return {
          icon: '🧊',
          message: `Beat the heat at ${Math.round(temp)}°F with a`,
          drink: randomDrink
        };
      }
    }

    // Rainy/stormy weather - recommend comfort drinks
    if (condition.includes('rain') || condition.includes('storm') || condition.includes('drizzle')) {
      const comfortDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('milk tea') ||
        d.name.toLowerCase().includes('matcha') ||
        d.name.toLowerCase().includes('taro')
      );
      if (comfortDrinks.length > 0) {
        const randomDrink = comfortDrinks[Math.floor(Math.random() * comfortDrinks.length)];
        return {
          icon: '☔',
          message: `Perfect rainy day for a`,
          drink: randomDrink
        };
      }
    }

    // Sunny weather - recommend refreshing drinks
    if (condition.includes('sunny') || condition.includes('clear')) {
      const refreshingDrinks = drinks.filter(d => 
        d.name.toLowerCase().includes('fruit') ||
        d.name.toLowerCase().includes('lemon') ||
        d.name.toLowerCase().includes('green tea')
      );
      if (refreshingDrinks.length > 0) {
        const randomDrink = refreshingDrinks[Math.floor(Math.random() * refreshingDrinks.length)];
        return {
          icon: '☀️',
          message: `Sunny and ${Math.round(temp)}°F - try a refreshing`,
          drink: randomDrink
        };
      }
    }

    return null;
  };

  const weatherRecommendation = useMemo(() => getWeatherRecommendation(), [currentWeather, drinks]);

  // Get font size classes (improved for Carol's macular degeneration)
  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'large': return 'text-xl';
      case 'extra-large': return 'text-2xl';
      default: return 'text-lg'; // Default slightly larger for readability
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
    const motionClass = reduceMotion ? '' : 'transition-all duration-200';
    return `${baseClass} ${bgClass} ${getFontSizeClass()} ${motionClass}`;
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

  // Translation function
  const translateText = async (text, targetLang) => {
    if (targetLang === 'en' || !text) return text;
    
    // Check cache first
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
    
    // Translate all menu items, categories, and options
    const translationPromises = [];
    const newTranslations = {};

    // Static labels to translate
    const staticLabels = [
      'Sweetness Level', 'Ice Level', 'Toppings', 'Total', 'Add to Cart',
      'View Cart', 'Your cart is empty.', 'Sweetness:', 'Ice:', 'Toppings:', 
      'Pay', 'Menu', 'Kiosk System', 'Accessibility:', 'Text Size:', 
      'Normal', 'Large', 'Extra Large', 'High Contrast', 'Language:'
    ];

    for (const label of staticLabels) {
      const key = `${label}_${lang}`;
      if (!translatedData[key]) {
        translationPromises.push(
          translateText(label, lang).then(result => {
            newTranslations[key] = result;
          })
        );
      }
    }

    // Translate categories
    for (const category of categories) {
      const key = `${category}_${lang}`;
      if (!translatedData[key]) {
        translationPromises.push(
          translateText(category, lang).then(result => {
            newTranslations[key] = result;
          })
        );
      }
    }

    // Translate drink names
    for (const drink of drinks) {
      const key = `${drink.name}_${lang}`;
      if (!translatedData[key]) {
        translationPromises.push(
          translateText(drink.name, lang).then(result => {
            newTranslations[key] = result;
          })
        );
      }
    }

    // Translate topping names
    for (const topping of toppings) {
      const key = `${topping.name}_${lang}`;
      if (!translatedData[key]) {
        translationPromises.push(
          translateText(topping.name, lang).then(result => {
            newTranslations[key] = result;
          })
        );
      }
    }

    // Translate sweetness options
    for (const option of sweetnessOptions) {
      const key = `${option.name}_${lang}`;
      if (!translatedData[key]) {
        translationPromises.push(
          translateText(option.name, lang).then(result => {
            newTranslations[key] = result;
          })
        );
      }
    }

    // Translate ice options
    for (const option of iceOptions) {
      const key = `${option.name}_${lang}`;
      if (!translatedData[key]) {
        translationPromises.push(
          translateText(option.name, lang).then(result => {
            newTranslations[key] = result;
          })
        );
      }
    }

    await Promise.all(translationPromises);
    setTranslatedData(prev => ({ ...prev, ...newTranslations }));
    setIsTranslating(false);
  };

  // Get translated text helper
  const getTranslatedText = (text) => {
    if (selectedLanguage === 'en' || !text) return text;
    const key = `${text}_${selectedLanguage}`;
    return translatedData[key] || text;
  };

  // Add a customized drink to the cart
  const handleAddToCart = (customizedDrink) => {
    setCart((prevCart) => {
      // Create a unique key based on drink and customizations
      const customizationKey = customizedDrink.customizations
        ? `${customizedDrink.menuitemid}-${customizedDrink.customizations.sweetness}-${customizedDrink.customizations.ice}-${customizedDrink.customizations.toppings.join(',')}`
        : customizedDrink.menuitemid;
      
      // Check if exact same item with same customizations exists
      const existingItem = prevCart.find((item) => {
        const itemKey = item.customizations
          ? `${item.menuitemid}-${item.customizations.sweetness}-${item.customizations.ice}-${item.customizations.toppings.join(',')}`
          : item.menuitemid;
        return itemKey === customizationKey;
      });

      if (existingItem) {
        return prevCart.map((item) => {
          const itemKey = item.customizations
            ? `${item.menuitemid}-${item.customizations.sweetness}-${item.customizations.ice}-${item.customizations.toppings.join(',')}`
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
      // Calculate reward discount
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
            📝 {getTranslatedText('Text Size')} <span className="text-sm font-normal">({getTranslatedText('For easier reading')})</span>
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
            🎨 {getTranslatedText('Display Mode')} <span className="text-sm font-normal">({getTranslatedText('For better visibility')})</span>
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

        {/* Large Click Targets for tremor */}
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            👆 {getTranslatedText('Button Size')} <span className="text-sm font-normal">({getTranslatedText('Easier to press')})</span>
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
            🎬 {getTranslatedText('Animation')} <span className="text-sm font-normal">({getTranslatedText('Reduce distractions')})</span>
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

        {/* Helpful Info */}
        <div className={`p-4 rounded-lg ${highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-blue-50 border-2 border-blue-200'}`}>
          <p className={`text-sm ${highContrast ? 'text-white' : 'text-gray-700'}`}>
            💡 {getTranslatedText('These settings make the kiosk easier to use. Try different options to find what works best for you!')}
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
          className={`fixed bottom-8 left-8 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 ${
            highContrast
              ? 'bg-yellow-400 text-black border-4 border-yellow-400'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          style={{ minWidth: '64px', minHeight: '64px', zIndex: 50 }}
          title="Accessibility Options"
        >
          <span className="text-3xl">♿</span>
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
            total={cartTotal}
            onPaymentSelect={handlePaymentSelect}
            onCancel={() => setShowPaymentModal(false)}
            highContrast={highContrast}
            getTranslatedText={getTranslatedText}
          />
        )}
        
        {/* Accessibility Button - Available on all screens */}
        <button
          onClick={() => setShowAccessibilityMenu(true)}
          className={`fixed bottom-8 left-8 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 ${
            highContrast
              ? 'bg-yellow-400 text-black border-4 border-yellow-400'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          style={{ minWidth: '64px', minHeight: '64px', zIndex: 50 }}
          title="Accessibility Options"
        >
          <span className="text-3xl">♿</span>
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
    <div className={getContainerClass()}>
      
      {/* Top Navigation Tabs */}
      <header className={`shadow-md ${highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-white'}`}>
        <div className="flex items-center justify-between px-8 py-4">
          {/* Left: Back Button + Kiosk Title + Role Badge + User Info */}
          <div className="flex items-center gap-8">
            {/* Back to Role Selection Button */}
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${getButtonSizeClass()} ${
                highContrast
                  ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Back to Role Selection"
            >
              ← {getTranslatedText('Back')}
            </button>

            <h1 className={`text-3xl font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>{getTranslatedText('ShareTea')}</h1>
            
            {/* Role Badge (for staff) */}
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
                      <div className={`text-xs ${highContrast ? 'text-white' : 'text-green-600'}`}>
                        🎁 {customer.loyaltyPoints} points
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className={`text-xs px-3 py-2 rounded ${getButtonSizeClass()} ${
                        highContrast 
                          ? 'bg-gray-800 text-yellow-400 border border-yellow-400 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Switch Account"
                    >
                      Switch
                    </button>
                  </>
                ) : (
                  // Show Log In button when in guest mode
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${getButtonSizeClass()} ${
                      highContrast
                        ? 'bg-yellow-400 text-black border-2 border-yellow-400 hover:bg-yellow-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    🎁 Log In
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
                  afterSignOutUrl="/"
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
            <div className="flex items-center gap-2">
              <span className={`text-sm ${highContrast ? 'text-yellow-400' : 'text-gray-600'}`}>🌐</span>
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
                <span className={`text-sm ${highContrast ? 'text-yellow-400' : 'text-gray-500'}`}>...</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 p-8">
        {/* Weather Recommendation Banner */}
        {weatherRecommendation && (
          <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 z-10 ${
            highContrast 
              ? 'bg-yellow-400 text-black border-4 border-yellow-500' 
              : 'bg-gradient-to-r from-green-400 to-blue-400 text-white'
          } px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => handleDrinkClick(weatherRecommendation.drink)}
          >
            <span className="text-2xl">{weatherRecommendation.icon}</span>
            <div>
              <span className="font-semibold">{weatherRecommendation.message}</span>{' '}
              <span className="underline font-bold">{weatherRecommendation.drink.name}</span>
            </div>
          </div>
        )}

        {/* Left-hand Category Navigation */}
        <nav className="w-1/5 pr-6">
          <h2 className={`text-2xl font-bold mb-6 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>Menu</h2>
          
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 font-medium focus:outline-none focus:ring-4 ${
                highContrast
                  ? 'bg-black text-yellow-400 border-yellow-400 placeholder-yellow-600 focus:ring-yellow-400'
                  : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400 focus:ring-green-500'
              }`}
              style={{ minHeight: '50px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`mt-2 text-sm underline ${
                  highContrast ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Clear search
              </button>
            )}
          </div>

          <ul>
            {categories.map((categoryName) => (
              <li key={categoryName} className="mb-3">
                <button
                  onClick={() => setSelectedCategory(categoryName)}
                  className={`w-full text-left p-5 rounded-lg font-semibold transition-colors ${getButtonSizeClass()} ${
                    selectedCategory === categoryName
                      ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400 shadow-lg' : 'bg-green-600 text-white shadow-md'
                      : highContrast ? 'bg-gray-900 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-800' : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                  }`}
                >
                  {getTranslatedText(categoryName)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Center Drink Grid */}
        <main className="w-3/5 px-6">
          {/* Search Results Info */}
          {searchQuery && (
            <div className={`mb-4 text-sm ${highContrast ? 'text-yellow-400' : 'text-gray-600'}`}>
              Found {visibleDrinks.length} drink{visibleDrinks.length !== 1 ? 's' : ''} matching "{searchQuery}"
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
        />
      )}

      {/* Accessibility Button - Available on all screens */}
      <button
        onClick={() => setShowAccessibilityMenu(true)}
        className={`fixed bottom-8 left-8 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 ${
          highContrast
            ? 'bg-yellow-400 text-black border-4 border-yellow-400'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
        style={{ minWidth: '64px', minHeight: '64px', zIndex: 50 }}
        title="Accessibility Options"
      >
        <span className="text-3xl">♿</span>
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