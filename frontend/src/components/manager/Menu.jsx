import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Menu Management Component
 * View, add, update menu items and prices
 */
export default function Menu() {
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
    return <div className="text-center py-8">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
          <p className="text-gray-600 mt-1">Manage menu items and prices</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddDrink}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-md flex items-center gap-2"
          >
            <span>➕</span>
            Add Drink
          </button>
          <button
            onClick={handleAddTopping}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md flex items-center gap-2"
          >
            <span>➕</span>
            Add Topping
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((category) => {
            const count = menuItems.filter(item => item.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div key={item.menuitemid} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.available ? '✓ Available' : '✗ Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
                      {item.type}
                    </span>
                    {item.category && (
                      <p className="text-sm text-gray-500">{item.category}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-2xl font-bold text-purple-600">${parseFloat(item.price).toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.menuitemid)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No menu items found in this category.</p>
        </div>
      )}

      {/* Add/Edit Drink Modal */}
      {showDrinkModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editItem ? 'Edit' : 'Add'} Drink</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={drinkFormData.name}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={drinkFormData.category}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={drinkFormData.price}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={drinkFormData.available}
                    onChange={(e) => setDrinkFormData({ ...drinkFormData, available: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for sale</span>
                </label>
              </div>

              {/* Recipe/Ingredients Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Recipe (Ingredients)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addIngredientToRecipe}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add Ingredient
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewIngredientModal(true)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      + Create New Ingredient
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {drinkFormData.recipe.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={item.ingredientid}
                        onChange={(e) => updateRecipeIngredient(index, 'ingredientid', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="">Select ingredient</option>
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
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredientFromRecipe(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {drinkFormData.recipe.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No ingredients added yet</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveDrink}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setShowDrinkModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Topping Modal */}
      {showToppingModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold mb-6">{editItem ? 'Edit' : 'Add'} Topping</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topping Name</label>
                <input
                  type="text"
                  value={toppingFormData.name}
                  onChange={(e) => setToppingFormData({ ...toppingFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Pearls (tapioca balls)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={toppingFormData.price}
                  onChange={(e) => setToppingFormData({ ...toppingFormData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toppingFormData.available}
                    onChange={(e) => setToppingFormData({ ...toppingFormData, available: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for sale</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveTopping}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setShowToppingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ingredient Modal */}
      {showNewIngredientModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-purple-600 mb-4">Create New Ingredient</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  value={newIngredientData.name}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Matcha Powder, Boba Pearls"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement *</label>
                <select
                  value={newIngredientData.unit}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The ingredient will be created with 0 quantity. You can update the stock quantity in the Inventory Management section.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateNewIngredient}
                disabled={!newIngredientData.name.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create & Add to Recipe
              </button>
              <button
                onClick={() => {
                  setShowNewIngredientModal(false);
                  setNewIngredientData({ name: '', unit: 'oz' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
