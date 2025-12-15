import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Menu Management Component
 * View, add, update menu items and prices
 */
export default function Menu({ 
  getTranslatedText,
  highContrast,
  fontSize,
  largeClickTargets,
  getTextSizeClass,
  getSmallTextClass,
  getExtraSmallTextClass,
  getHeadingSizeClass
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showNewIngredientModal, setShowNewIngredientModal] = useState(false);
  const [newIngredientData, setNewIngredientData] = useState({
    name: '',
    unit: 'oz'
  });
  const [drinkFormData, setDrinkFormData] = useState({
    name: '',
    category: '',
    price: '',
    available: true,
    recipe: [] // Array of {ingredientid, quantity}
  });
  const [toppingFormData, setToppingFormData] = useState({
    name: '',
    price: '',
    available: true
  });

  // Button size helper
  const getButtonSizeClass = () => {
    if (largeClickTargets) return 'min-h-[60px] py-4';
    return 'min-h-[44px] py-3';
  };

  useEffect(() => {
    fetchMenu();
    fetchIngredients();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.menu);
      const data = await response.json();
      setMenuItems(data.menu_items || []);
      setCategories(data.categories?.map(c => c.category) || []);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.manager.inventory);
      const data = await response.json();
      setIngredients(data || []);
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
    }
  };

  const handleAddDrink = () => {
    setEditItem(null);
    setDrinkFormData({ 
      name: '', 
      category: '', 
      price: '', 
      available: true, 
      recipe: [] 
    });
    setShowDrinkModal(true);
  };

  const handleAddTopping = () => {
    setEditItem(null);
    setToppingFormData({ 
      name: '', 
      price: '', 
      available: true
    });
    setShowToppingModal(true);
  };

  const handleEdit = async (item) => {
    setEditItem(item);
    
    if (item.type === 'Topping') {
      // Edit topping - simple form
      setToppingFormData({
        name: item.name,
        price: item.price,
        available: item.available !== false
      });
      setShowToppingModal(true);
    } else {
      // Edit drink - full form with recipe
      try {
        const response = await fetch(`${API_ENDPOINTS.manager.menu}/${item.menuitemid}/recipe`);
        const recipeData = await response.json();
        
        setDrinkFormData({
          name: item.name,
          category: item.category || '',
          price: item.price,
          available: item.available !== false,
          recipe: recipeData
        });
      } catch (error) {
        console.error('Error fetching recipe:', error);
        setDrinkFormData({
          name: item.name,
          category: item.category || '',
          price: item.price,
          available: item.available !== false,
          recipe: []
        });
      }
      setShowDrinkModal(true);
    }
  };

  const handleSaveDrink = async () => {
    try {
      const url = editItem 
        ? `${API_ENDPOINTS.manager.menu}/${editItem.menuitemid}`
        : API_ENDPOINTS.manager.menu;
      const method = editItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: drinkFormData.name,
          type: 'Drink',
          category: drinkFormData.category,
          price: parseFloat(drinkFormData.price),
          available: drinkFormData.available,
          recipe: drinkFormData.recipe
        })
      });
      
      if (!response.ok) throw new Error('Failed to save drink');
      
      fetchMenu();
      setShowDrinkModal(false);
      setEditItem(null);
    } catch (error) {
      console.error('Failed to save drink:', error);
      alert('Failed to save drink');
    }
  };

  const handleSaveTopping = async () => {
    try {
      const url = editItem 
        ? `${API_ENDPOINTS.manager.menu}/${editItem.menuitemid}`
        : API_ENDPOINTS.manager.menu;
      const method = editItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toppingFormData.name,
          type: 'Topping',
          category: '',
          price: parseFloat(toppingFormData.price),
          available: toppingFormData.available,
          recipe: []
        })
      });
      
      if (!response.ok) throw new Error('Failed to save topping');
      
      fetchMenu();
      setShowToppingModal(false);
      setEditItem(null);
    } catch (error) {
      console.error('Failed to save topping:', error);
      alert('Failed to save topping');
    }
  };

  const addIngredientToRecipe = () => {
    setDrinkFormData({
      ...drinkFormData,
      recipe: [...drinkFormData.recipe, { ingredientid: '', quantity: '' }]
    });
  };

  const removeIngredientFromRecipe = (index) => {
    setDrinkFormData({
      ...drinkFormData,
      recipe: drinkFormData.recipe.filter((_, i) => i !== index)
    });
  };

  const updateRecipeIngredient = (index, field, value) => {
    const newRecipe = [...drinkFormData.recipe];
    newRecipe[index][field] = value;
    setDrinkFormData({ ...drinkFormData, recipe: newRecipe });
  };

  const handleCreateNewIngredient = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.manager.inventory, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientname: newIngredientData.name,
          quantity: 0,
          unit: newIngredientData.unit
        })
      });

      if (!response.ok) throw new Error('Failed to create ingredient');
      
      const newIngredient = await response.json();
      
      // Refresh ingredients list
      await fetchIngredients();
      
      // Add the new ingredient to the recipe
      setDrinkFormData({
        ...drinkFormData,
        recipe: [...drinkFormData.recipe, { 
          ingredientid: newIngredient.ingredientid, 
          quantity: '' 
        }]
      });
      
      // Reset and close modal
      setNewIngredientData({ name: '', unit: 'oz' });
      setShowNewIngredientModal(false);
      alert('Ingredient created successfully! You can update the quantity in Inventory Management.');
    } catch (error) {
      console.error('Failed to create ingredient:', error);
      alert('Failed to create ingredient');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.manager.menu}/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete menu item');
        fetchMenu();
      } catch (error) {
        console.error('Failed to delete menu item:', error);
        alert('Failed to delete menu item');
      }
    }
  };

  const filteredMenu = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return <div className={`text-center py-8 ${getTextSizeClass()}`}>{getTranslatedText('Loading...')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'} ${getHeadingSizeClass('h2')}`}>
            {getTranslatedText('Menu Management')}
          </h2>
          <p className={`mt-1 ${highContrast ? 'text-gray-300' : 'text-gray-600'} ${getSmallTextClass()}`}>
            {getTranslatedText('Manage menu items and prices')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddDrink}
            className={`px-6 rounded-lg font-semibold shadow-md ${getButtonSizeClass()} ${getTextSizeClass()} ${
              highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {getTranslatedText('Add Drink')}
          </button>
          <button
            onClick={handleAddTopping}
            className={`px-6 rounded-lg font-semibold shadow-md ${getButtonSizeClass()} ${getTextSizeClass()} ${
              highContrast
                ? 'bg-green-900 text-green-200 border-2 border-green-400 hover:bg-green-800'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {getTranslatedText('Add Topping')}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className={`p-4 rounded-lg shadow ${highContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white'}`}>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 rounded-lg font-medium ${getButtonSizeClass()} ${getTextSizeClass()} ${
              selectedCategory === 'all'
                ? highContrast ? 'bg-yellow-400 text-black border-2 border-yellow-400' : 'bg-purple-600 text-white'
                : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getTranslatedText('All Items')} ({menuItems.length})
          </button>
          {categories.map((category) => {
            const count = menuItems.filter(item => item.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 rounded-lg font-medium ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  selectedCategory === category
                    ? highContrast ? 'bg-yellow-400 text-black border-2 border-yellow-400' : 'bg-purple-600 text-white'
                    : highContrast ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenu.map((item) => (
          <div key={item.menuitemid} className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
            highContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold ${getTextSizeClass()} ${
                      highContrast ? 'text-yellow-400' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full ${getExtraSmallTextClass()} ${
                      item.available 
                        ? highContrast ? 'bg-green-900 text-green-200 border border-green-400' : 'bg-green-100 text-green-800'
                        : highContrast ? 'bg-red-900 text-red-200 border border-red-400' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.available ? getTranslatedText('Available') : getTranslatedText('Unavailable')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-medium ${getExtraSmallTextClass()} ${
                      highContrast ? 'bg-purple-900 text-purple-200 border border-purple-400' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {getTranslatedText(item.type)}
                    </span>
                    {item.category && (
                      <p className={`${getSmallTextClass()} ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.category}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <span className={`font-bold ${getHeadingSizeClass('h3')} ${
                  highContrast ? 'text-yellow-400' : 'text-purple-600'
                }`}>
                  ${parseFloat(item.price).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className={`flex-1 px-4 rounded-lg font-medium ${getButtonSizeClass()} ${getSmallTextClass()} ${
                    highContrast
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {getTranslatedText('Edit')}
                </button>
                <button
                  onClick={() => handleDelete(item.menuitemid)}
                  className={`px-4 rounded-lg font-medium ${getButtonSizeClass()} ${getSmallTextClass()} ${
                    highContrast
                      ? 'bg-red-900 text-red-200 border-2 border-red-400 hover:bg-red-800'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {getTranslatedText('Delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className={`text-center py-12 rounded-lg shadow ${getTextSizeClass()} ${
          highContrast ? 'bg-gray-900 border-2 border-yellow-400 text-gray-400' : 'bg-white text-gray-500'
        }`}>
          <p>{getTranslatedText('No menu items found in this category.')}</p>
        </div>
      )}

      {/* Add/Edit Drink Modal */}
      {showDrinkModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto ${
            highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
          }`}>
            <h3 className={`font-bold mb-6 ${getHeadingSizeClass('h3')} ${
              highContrast ? 'text-yellow-400' : 'text-gray-900'
            }`}>
              {editItem ? getTranslatedText('Edit') : getTranslatedText('Add')} {getTranslatedText('Drink')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block font-medium mb-2 ${getSmallTextClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Item Name')}
                </label>
                <input
                  type="text"
                  value={drinkFormData.name}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, name: e.target.value })}
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-medium mb-2 ${getSmallTextClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Category')}
                </label>
                <select
                  value={drinkFormData.category}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, category: e.target.value })}
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500'
                  }`}
                >
                  <option value="">{getTranslatedText('Select a category')}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-medium mb-2 ${getSmallTextClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Price')} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={drinkFormData.price}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, price: e.target.value })}
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500'
                  }`}
                />
              </div>

              <div>
                <label className={`flex items-center gap-2 cursor-pointer ${getSmallTextClass()}`}>
                  <input
                    type="checkbox"
                    checked={drinkFormData.available}
                    onChange={(e) => setDrinkFormData({ ...drinkFormData, available: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className={`font-medium ${highContrast ? 'text-yellow-400' : 'text-gray-700'}`}>
                    {getTranslatedText('Available for sale')}
                  </span>
                </label>
              </div>

              {/* Recipe/Ingredients Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block font-medium ${getSmallTextClass()} ${
                    highContrast ? 'text-yellow-400' : 'text-gray-700'
                  }`}>
                    {getTranslatedText('Recipe (Ingredients)')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addIngredientToRecipe}
                      className={`font-medium ${getExtraSmallTextClass()} ${
                        highContrast ? 'text-yellow-400 hover:text-yellow-300' : 'text-purple-600 hover:text-purple-700'
                      }`}
                    >
                      + {getTranslatedText('Add Ingredient')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewIngredientModal(true)}
                      className={`font-medium ${getExtraSmallTextClass()} ${
                        highContrast ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      + {getTranslatedText('Create New Ingredient')}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {drinkFormData.recipe.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={item.ingredientid}
                        onChange={(e) => updateRecipeIngredient(index, 'ingredientid', e.target.value)}
                        className={`flex-1 px-3 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getSmallTextClass()} ${
                          highContrast
                            ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400'
                            : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500'
                        }`}
                      >
                        <option value="">{getTranslatedText('Select ingredient')}</option>
                        {ingredients.map((ing) => (
                          <option key={ing.ingredientid} value={ing.ingredientid}>
                            {ing.ingredientname} ({ing.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateRecipeIngredient(index, 'quantity', e.target.value)}
                        className={`w-20 px-3 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getSmallTextClass()} ${
                          highContrast
                            ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400 placeholder-gray-600'
                            : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500 placeholder-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredientFromRecipe(index)}
                        className={`px-3 ${getSmallTextClass()} ${
                          highContrast ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                        }`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {drinkFormData.recipe.length === 0 && (
                    <p className={`italic ${getSmallTextClass()} ${highContrast ? 'text-gray-500' : 'text-gray-500'}`}>
                      {getTranslatedText('No ingredients added yet')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveDrink}
                className={`flex-1 px-4 rounded-lg font-semibold ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {getTranslatedText('Save')}
              </button>
              <button
                onClick={() => setShowDrinkModal(false)}
                className={`flex-1 px-4 rounded-lg font-semibold ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText('Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Topping Modal */}
      {showToppingModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-8 ${
            highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
          }`}>
            <h3 className={`font-bold mb-6 ${getHeadingSizeClass('h3')} ${
              highContrast ? 'text-yellow-400' : 'text-gray-900'
            }`}>
              {editItem ? getTranslatedText('Edit') : getTranslatedText('Add')} {getTranslatedText('Topping')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block font-medium mb-2 ${getSmallTextClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Topping Name')}
                </label>
                <input
                  type="text"
                  value={toppingFormData.name}
                  onChange={(e) => setToppingFormData({ ...toppingFormData, name: e.target.value })}
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400 placeholder-gray-600'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-green-500 placeholder-gray-400'
                  }`}
                  placeholder="e.g., Pearls (tapioca balls)"
                />
              </div>

              <div>
                <label className={`block font-medium mb-2 ${getSmallTextClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Price')} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={toppingFormData.price}
                  onChange={(e) => setToppingFormData({ ...toppingFormData, price: e.target.value })}
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-green-500'
                  }`}
                />
              </div>

              <div>
                <label className={`flex items-center gap-2 cursor-pointer ${getSmallTextClass()}`}>
                  <input
                    type="checkbox"
                    checked={toppingFormData.available}
                    onChange={(e) => setToppingFormData({ ...toppingFormData, available: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className={`font-medium ${highContrast ? 'text-yellow-400' : 'text-gray-700'}`}>
                    {getTranslatedText('Available for sale')}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveTopping}
                className={`flex-1 px-4 rounded-lg font-semibold ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  highContrast
                    ? 'bg-green-900 text-green-200 border-2 border-green-400 hover:bg-green-800'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {getTranslatedText('Save')}
              </button>
              <button
                onClick={() => setShowToppingModal(false)}
                className={`flex-1 px-4 rounded-lg font-semibold ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText('Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ingredient Modal */}
      {showNewIngredientModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 ${
            highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
          }`}>
            <h3 className={`font-bold mb-4 ${getHeadingSizeClass('h3')} ${
              highContrast ? 'text-yellow-400' : 'text-purple-600'
            }`}>
              {getTranslatedText('Create New Ingredient')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block font-medium mb-1 ${getSmallTextClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Ingredient Name')} *
                </label>
                <input
                  type="text"
                  value={newIngredientData.name}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, name: e.target.value })}
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400 placeholder-gray-600'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500 placeholder-gray-400'
                  }`}
                  placeholder="e.g., Matcha Powder, Boba Pearls"
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 ${getSmallTextClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Unit of Measurement')} *
                </label>
                <select
                  value={newIngredientData.unit}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, unit: e.target.value })}
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500'
                  }`}
                >
                  <option value="oz">oz (ounces)</option>
                  <option value="g">g (grams)</option>
                  <option value="ml">ml (milliliters)</option>
                  <option value="L">L (liters)</option>
                  <option value="cups">cups</option>
                  <option value="tbsp">tbsp (tablespoons)</option>
                  <option value="tsp">tsp (teaspoons)</option>
                  <option value="pieces">pieces</option>
                  <option value="units">units</option>
                </select>
              </div>

              <div className={`border rounded-lg p-3 ${
                highContrast ? 'bg-gray-800 border-blue-400' : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`${getSmallTextClass()} ${
                  highContrast ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  <strong>{getTranslatedText('Note')}:</strong> {getTranslatedText('The ingredient will be created with 0 quantity. You can update the stock quantity in the Inventory Management section.')}
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateNewIngredient}
                disabled={!newIngredientData.name.trim()}
                className={`flex-1 px-4 rounded-lg font-semibold ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  highContrast
                    ? 'bg-green-900 text-green-200 border-2 border-green-400 hover:bg-green-800 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600'
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                {getTranslatedText('Create & Add to Recipe')}
              </button>
              <button
                onClick={() => {
                  setShowNewIngredientModal(false);
                  setNewIngredientData({ name: '', unit: 'oz' });
                }}
                className={`flex-1 px-4 rounded-lg font-semibold ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText('Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
