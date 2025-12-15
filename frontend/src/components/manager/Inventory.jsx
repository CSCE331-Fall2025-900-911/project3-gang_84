import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Inventory Management Component
 * View, add, update inventory items and quantities
 */
export default function Inventory({ 
  getTranslatedText,
  highContrast,
  fontSize,
  largeClickTargets,
  getTextSizeClass,
  getSmallTextClass,
  getExtraSmallTextClass,
  getHeadingSizeClass
}) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    ingredientname: '',
    quantity: '',
    unit: ''
  });

  // Button size helper
  const getButtonSizeClass = () => {
    if (largeClickTargets) return 'min-h-[60px] py-4';
    return 'min-h-[44px] py-3';
  };

  useEffect(() => {
    fetchInventory();
    
    // Auto-refresh inventory every 30 seconds to reflect order deductions
    const intervalId = setInterval(() => {
      fetchInventory();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.manager.inventory);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      alert('Failed to load inventory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ ingredientname: '', quantity: '', unit: '' });
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData(item);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editItem 
        ? `${API_ENDPOINTS.manager.inventory}/${editItem.ingredientid}`
        : API_ENDPOINTS.manager.inventory;
      const method = editItem ? 'PUT' : 'POST';
      
      const payload = {
        ingredientname: formData.ingredientname,
        quantity: parseInt(formData.quantity),
        unit: formData.unit
      };
      
      console.log('Saving inventory item:', payload);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('Response:', response.status, data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save inventory item');
      }
      
      setShowAddModal(false);
      fetchInventory();
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      alert(`Failed to save inventory item: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.manager.inventory}/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete inventory item');
        fetchInventory();
      } catch (error) {
        console.error('Failed to delete inventory item:', error);
        alert('Failed to delete inventory item');
      }
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.ingredientname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= item.reorder_level);

  if (loading) {
    return <div className={`text-center py-8 ${getTextSizeClass()}`}>{getTranslatedText('Loading...')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'} ${getHeadingSizeClass('h2')}`}>
            {getTranslatedText('Inventory Management')}
          </h2>
          <p className={`mt-1 ${highContrast ? 'text-gray-300' : 'text-gray-600'} ${getSmallTextClass()}`}>
            {getTranslatedText('Manage stock levels and reorder items')}
            {lastUpdated && (
              <span className={getExtraSmallTextClass()}>
                {' • '}{getTranslatedText('Last updated')}: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={`px-4 rounded-lg font-semibold shadow-md ${getButtonSizeClass()} ${getTextSizeClass()} ${
              highContrast 
                ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={getTranslatedText('Refresh')}
          >
            {refreshing ? getTranslatedText('Refreshing...') : getTranslatedText('Refresh')}
          </button>
          <button
            onClick={handleAdd}
            className={`px-6 rounded-lg font-semibold shadow-md ${getButtonSizeClass()} ${getTextSizeClass()} ${
              highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {getTranslatedText('Add Item')}
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className={`border-l-4 p-4 rounded-lg ${
          highContrast 
            ? 'bg-gray-800 border-yellow-400'
            : 'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex">
            <div className="ml-3">
              <h3 className={`font-medium ${getTextSizeClass()} ${
                highContrast ? 'text-yellow-400' : 'text-yellow-800'
              }`}>
                {getTranslatedText('Low Stock Alert')}
              </h3>
              <div className={`mt-2 ${getSmallTextClass()} ${
                highContrast ? 'text-gray-300' : 'text-yellow-700'
              }`}>
                <p>{lowStockItems.length} {getTranslatedText('item(s) need restocking')}:</p>
                <ul className="list-disc list-inside mt-1">
                  {lowStockItems.map(item => (
                    <li key={item.ingredientid}>
                      {item.ingredientname} ({item.quantity} {item.unit} {getTranslatedText('remaining')})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className={`p-4 rounded-lg shadow ${highContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white'}`}>
        <input
          type="text"
          placeholder={getTranslatedText('Search inventory...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
            highContrast
              ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400 placeholder-gray-600'
              : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500 placeholder-gray-400'
          }`}
        />
      </div>

      {/* Inventory Table */}
      <div className={`rounded-lg shadow overflow-hidden ${highContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white'}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={highContrast ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              <th className={`px-6 py-3 text-left font-medium uppercase tracking-wider ${getExtraSmallTextClass()} ${
                highContrast ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {getTranslatedText('Item Name')}
              </th>
              <th className={`px-6 py-3 text-left font-medium uppercase tracking-wider ${getExtraSmallTextClass()} ${
                highContrast ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {getTranslatedText('Quantity')}
              </th>
              <th className={`px-6 py-3 text-left font-medium uppercase tracking-wider ${getExtraSmallTextClass()} ${
                highContrast ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {getTranslatedText('Unit')}
              </th>
              <th className={`px-6 py-3 text-left font-medium uppercase tracking-wider ${getExtraSmallTextClass()} ${
                highContrast ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {getTranslatedText('Status')}
              </th>
              <th className={`px-6 py-3 text-right font-medium uppercase tracking-wider ${getExtraSmallTextClass()} ${
                highContrast ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {getTranslatedText('Actions')}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${highContrast ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'}`}>
            {filteredInventory.map((item) => (
              <tr key={item.ingredientid} className={highContrast ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                <td className={`px-6 py-4 whitespace-nowrap font-medium ${getTextSizeClass()} ${
                  highContrast ? 'text-yellow-400' : 'text-gray-900'
                }`}>
                  {item.ingredientname}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${getTextSizeClass()} ${
                  highContrast ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  {item.quantity}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${getTextSizeClass()} ${
                  highContrast ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {item.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.quantity <= 20 ? (
                    <span className={`px-2 py-1 font-semibold rounded-full ${getExtraSmallTextClass()} ${
                      highContrast 
                        ? 'bg-red-900 text-red-200 border-2 border-red-400'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getTranslatedText('Low Stock')}
                    </span>
                  ) : (
                    <span className={`px-2 py-1 font-semibold rounded-full ${getExtraSmallTextClass()} ${
                      highContrast
                        ? 'bg-green-900 text-green-200 border-2 border-green-400'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getTranslatedText('In Stock')}
                    </span>
                  )}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${getSmallTextClass()}`}>
                  <button
                    onClick={() => handleEdit(item)}
                    className={`mr-4 ${
                      highContrast ? 'text-yellow-400 hover:text-yellow-300' : 'text-purple-600 hover:text-purple-900'
                    }`}
                  >
                    {getTranslatedText('Edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(item.ingredientid)}
                    className={highContrast ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}
                  >
                    {getTranslatedText('Delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto ${
            highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
          }`}>
            <h3 className={`font-bold mb-6 ${getHeadingSizeClass('h3')} ${
              highContrast ? 'text-yellow-400' : 'text-gray-900'
            }`}>
              {editItem ? getTranslatedText('Edit') : getTranslatedText('Add')} {getTranslatedText('Inventory Item')}
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
                  value={formData.ingredientname}
                  onChange={(e) => setFormData({ ...formData, ingredientname: e.target.value })}
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
                  {getTranslatedText('Quantity')}
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                  {getTranslatedText('Unit')}
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="ml/g, oz, lbs, units"
                  className={`w-full px-4 rounded-lg focus:outline-none focus:ring-2 ${getButtonSizeClass()} ${getTextSizeClass()} ${
                    highContrast
                      ? 'bg-black text-yellow-400 border-2 border-yellow-400 focus:ring-yellow-400 placeholder-gray-600'
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-purple-500 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                className={`flex-1 px-4 rounded-lg font-semibold ${getButtonSizeClass()} ${getTextSizeClass()} ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {getTranslatedText('Save')}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
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
