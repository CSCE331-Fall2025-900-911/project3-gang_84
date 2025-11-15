import React, { useState, useMemo, useEffect } from 'react';
import Weather from './components/Weather';
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
    <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center z-50" style={{ backgroundColor: highContrast ? 'rgba(0,0,0,0.8)' : '#f8ffe9' }} onClick={onClose}>
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
function Cart({ cartItems, total, highContrast, getTranslatedText }) {
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
        <button className={`w-full py-5 rounded-lg text-xl font-bold shadow-lg transition-colors ${
          highContrast 
            ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300' 
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
        style={{ minHeight: '60px' }}
        >
          {getTranslatedText('Pay')} ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

// The main Kiosk App
export default function App() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'weather'
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
  
  // Accessibility states for Carol
  const [fontSize, setFontSize] = useState('normal'); // 'normal', 'large', 'extra-large'
  const [highContrast, setHighContrast] = useState(false);

  // Get font size classes
  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  };

  // Get container class with accessibility settings
  const getContainerClass = () => {
    const baseClass = 'flex flex-col w-full min-h-screen font-sans';
    const bgClass = highContrast ? 'bg-black' : 'bg-lime-50';
    return `${baseClass} ${bgClass} ${getFontSizeClass()}`;
  };

  // --- Data Fetching ---
  useEffect(() => {
    // This function fetches data from your backend
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
        
        setCategories(categoryNames);
        setDrinks(data.menu_items);
        setToppings(data.toppings || []);
        setSweetnessOptions(data.sweetness_options || []);
        setIceOptions(data.ice_options || []);
        
        // Set the default selected category
        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames[0]);
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
  }, []); // The empty array [] means this effect runs once when the component mounts

  // Filter drinks based on the selected category
  const visibleDrinks = useMemo(() => {
    // Filter by lowercase 'category' column from database
    return drinks.filter((d) => d.category === selectedCategory);
  }, [selectedCategory, drinks]);

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
    return text; // Return original if translation fails
  };

  // Handle language change
  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    if (lang === 'en') {
      setTranslatedData({}); // Clear translations for English
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

  // --- Render Logic ---
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading menu...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className={getContainerClass()}>
      
      {/* Top Navigation Tabs */}
      <header className={`shadow-md ${highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-white'}`}>
        <div className="flex items-center justify-between px-8 py-4">
          <h1 className={`text-3xl font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>{getTranslatedText('Kiosk System')}</h1>
          <div className="flex items-center gap-6">
            {/* Accessibility Controls for Carol */}
            <div className="flex items-center gap-3 border-r pr-6">
              <span className={`text-sm font-semibold ${highContrast ? 'text-yellow-400' : 'text-gray-700'}`}>♿ {getTranslatedText('Accessibility:')}</span>
              
              {/* Font Size Controls */}
              <div className="flex items-center gap-2">
                <span className={`text-xs ${highContrast ? 'text-white' : 'text-gray-600'}`}>{getTranslatedText('Text Size:')}</span>
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                    fontSize === 'normal'
                      ? highContrast ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white'
                      : highContrast ? 'bg-gray-700 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ minWidth: '50px', minHeight: '44px' }}
                  title={getTranslatedText('Normal')}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-3 py-2 rounded-lg font-bold transition-colors text-lg ${
                    fontSize === 'large'
                      ? highContrast ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white'
                      : highContrast ? 'bg-gray-700 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ minWidth: '50px', minHeight: '44px' }}
                  title={getTranslatedText('Large')}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('extra-large')}
                  className={`px-3 py-2 rounded-lg font-bold transition-colors text-xl ${
                    fontSize === 'extra-large'
                      ? highContrast ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white'
                      : highContrast ? 'bg-gray-700 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ minWidth: '50px', minHeight: '44px' }}
                  title={getTranslatedText('Extra Large')}
                >
                  A
                </button>
              </div>

              {/* High Contrast Toggle */}
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  highContrast
                    ? 'bg-yellow-400 text-black border-2 border-yellow-400'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
                style={{ minHeight: '44px' }}
              >
                {highContrast ? `🌞 ${getTranslatedText('Normal')} ${getTranslatedText('High Contrast')}` : `🌓 ${getTranslatedText('High Contrast')}`}
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${highContrast ? 'text-yellow-400' : 'text-gray-600'}`}>🌐 {getTranslatedText('Language:')}</span>
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
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="zh-CN">中文 (Chinese)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="ko">한국어 (Korean)</option>
                <option value="vi">Tiếng Việt (Vietnamese)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
              {isTranslating && (
                <span className="text-sm text-gray-500">Translating...</span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'menu'
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400 shadow-lg' : 'bg-green-600 text-white shadow-md'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ minHeight: '50px', minWidth: '120px' }}
            >
              🥤 {getTranslatedText('Menu')}
            </button>
            <button
              onClick={() => setActiveTab('weather')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'weather'
                  ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400 shadow-lg' : 'bg-blue-600 text-white shadow-md'
                  : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ minHeight: '50px', minWidth: '120px' }}
            >
              ☀️ Weather
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 p-8">
        {activeTab === 'menu' ? (
          <>
            {/* Left-hand Category Navigation */}
            <nav className="w-1/5 pr-6">
              <h2 className={`text-2xl font-bold mb-6 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>Menu</h2>
              <ul>
                {categories.map((categoryName) => (
                  <li key={categoryName} className="mb-3">
                    <button
                      onClick={() => setSelectedCategory(categoryName)}
                      className={`w-full text-left p-5 rounded-lg font-semibold transition-colors ${
                        selectedCategory === categoryName
                          ? highContrast ? 'bg-yellow-400 text-black border-4 border-yellow-400 shadow-lg' : 'bg-green-600 text-white shadow-md'
                          : highContrast ? 'bg-gray-900 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-800' : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                      }`}
                      style={{ minHeight: '60px' }}
                    >
                      {getTranslatedText(categoryName)}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Center Drink Grid */}
            <main className="w-3/5 px-6">
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
            <Cart cartItems={cart} total={cartTotal} highContrast={highContrast} getTranslatedText={getTranslatedText} />
          </>
        ) : (
          /* Weather Tab */
          <div className="flex-1">
            <Weather />
          </div>
        )}
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
    </div>
  );
}