import React, { useState, useMemo, useEffect } from 'react';

// A single drink item in the grid
function DrinkCard({ drink, onAddToCart }) {
  return (
    <div
      className="flex flex-col items-center justify-between p-4 bg-white rounded-lg shadow-md cursor-pointer transition-transform transform hover:scale-105"
      onClick={() => onAddToCart(drink)}
    >
      <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
        <span className="text-4xl">🥤</span>
      </div>
      <span className="text-center font-medium">{drink.Name}</span>
      <span className="text-gray-600">${parseFloat(drink.Price).toFixed(2)}</span>
    </div>
  );
}

// The sidebar showing the cart
function Cart({ cartItems, total }) {
  return (
    <div className="w-1/4 bg-white p-6 shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">View Cart</h2>
      <div className="flex-grow overflow-y-auto mb-4" style={{maxHeight: '60vh'}}>
        {cartItems.length === 0 ? (
          <p className="text-gray-500 text-center">Your cart is empty.</p>
        ) : (
          cartItems.map((item, index) => (
            <div
              key={`${item.MenuItemID}-${index}`} // Use a more robust key for cart items
              className="flex justify-between items-center mb-4"
            >
              <div>
                <span className="font-medium">{item.Name}</span>
                <span className="text-sm text-gray-500 block">
                  {item.quantity} x ${parseFloat(item.Price).toFixed(2)}
                </span>
              </div>
              <span className="font-semibold">
                ${(item.quantity * parseFloat(item.Price)).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
      
      <div className="border-t pt-6">
        <div className="flex justify-between items-center text-xl font-bold mb-6">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-bold shadow-md hover:bg-green-700 transition-colors">
          Pay ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

// The main Kiosk App
export default function App() {
  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/menu');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // The backend sends { categories: [], menu_items: [] }
        // The categories are objects like { category: 'Milky Series' }
        const categoryNames = data.categories.map(cat => cat.category);
        
        setCategories(categoryNames);
        setDrinks(data.menu_items);
        
        // Set the default selected category
        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames[0]);
        }
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch menu:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []); // The empty array [] means this effect runs once when the component mounts

  // Filter drinks based on the selected category
  const visibleDrinks = useMemo(() => {
    // This now filters by the 'Category' column (case-sensitive)
    return drinks.filter((d) => d.Category === selectedCategory);
  }, [selectedCategory, drinks]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + parseFloat(item.Price) * item.quantity, 0);
  }, [cart]);

  // Add a drink to the cart
  const handleAddToCart = (drink) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.MenuItemID === drink.MenuItemID);
      if (existingItem) {
        return prevCart.map((item) =>
          item.MenuItemID === drink.MenuItemID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...drink, quantity: 1 }];
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
    <div className="flex w-full min-h-screen p-8 bg-lime-50 font-sans">
      
      {/* Left-hand Category Navigation */}
      <nav className="w-1/5 pr-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Menu</h1>
        <ul>
          {categories.map((categoryName) => (
            <li key={categoryName} className="mb-2">
              <button
                onClick={() => setSelectedCategory(categoryName)}
                className={`w-full text-left p-4 rounded-lg font-medium transition-colors ${
                  selectedCategory === categoryName
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {categoryName}
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
              key={drink.MenuItemID}
              drink={drink}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </main>

      {/* Right-hand Cart Sidebar */}
      <Cart cartItems={cart} total={cartTotal} />
    </div>
  );
}