import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Menu Management Component
 * View, add, update menu items and prices
 */
export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    available: true,
    type: 'cold'
  });

  useEffect(() => {
    fetchMenu();
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

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ name: '', category: '', price: '', available: true, type: 'cold' });
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      available: item.available !== false,
      type: item.type || 'cold'
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editItem 
        ? `${API_ENDPOINTS.manager.menu}/${editItem.menuitemid}`
        : API_ENDPOINTS.manager.menu;
      const method = editItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          available: formData.available,
          type: formData.type || 'Drink'
        })
      });
      
      if (!response.ok) throw new Error('Failed to save menu item');
      setShowAddModal(false);
      fetchMenu();
    } catch (error) {
      console.error('Failed to save menu item:', error);
      alert('Failed to save menu item');
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

  const handleToggleAvailability = async (item) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.manager.menu}/${item.menuitemid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          available: !item.available
        })
      });
      if (!response.ok) throw new Error('Failed to toggle availability');
      fetchMenu();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      alert('Failed to toggle availability');
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
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold shadow-md flex items-center gap-2"
        >
          <span>➕</span>
          Add Menu Item
        </button>
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
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  item.available !== false
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.available !== false ? 'Available' : 'Unavailable'}
                </span>
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
                  onClick={() => handleToggleAvailability(item)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  {item.available !== false ? 'Disable' : 'Enable'}
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-6">{editItem ? 'Edit' : 'Add'} Menu Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="cold">Cold</option>
                  <option value="hot">Hot</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                  Available for sale
                </label>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setShowAddModal(false)}
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
