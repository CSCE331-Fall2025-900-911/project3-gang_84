import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Ordering Trends Component
 * Analyze order history data over user-specified time intervals
 */
export default function OrderingTrends() {
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState('daily');
  const [salesData, setSalesData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categoryColors = {
    'Milk Series': '#8B5CF6',
    'Fruit Series': '#EC4899',
    'Ice Blend': '#06B6D4',
    'Coffee': '#F59E0B',
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });

      // Fetch sales data
      const salesResponse = await fetch(`${API_ENDPOINTS.manager.reports.sales}?${params}`);
      if (!salesResponse.ok) throw new Error('Failed to fetch sales data');
      const salesJson = await salesResponse.json();
      
      // Transform sales data for chart
      setSalesData((salesJson.data || []).map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        sales: parseFloat(item.revenue || 0),
        orders: parseInt(item.orders || 0)
      })));

      // Fetch popular items
      const itemsResponse = await fetch(`${API_ENDPOINTS.manager.reports.popularItems}?${params}`);
      if (!itemsResponse.ok) throw new Error('Failed to fetch popular items');
      const itemsJson = await itemsResponse.json();
      
      setPopularItems((itemsJson.items || []).map(item => ({
        name: item.name,
        orders: parseInt(item.orders || 0),
        revenue: parseFloat(item.revenue || 0)
      })));

      // Fetch category data
      const categoriesResponse = await fetch(`${API_ENDPOINTS.manager.reports.categories}?${params}`);
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
      const categoriesJson = await categoriesResponse.json();
      
      const total = categoriesJson.data.reduce((sum, cat) => sum + parseInt(cat.orders || 0), 0);
      setCategoryData((categoriesJson.data || []).map(cat => ({
        name: cat.category,
        value: total > 0 ? Math.round((parseInt(cat.orders || 0) / total) * 100) : 0,
        color: categoryColors[cat.category] || '#6B7280'
      })));

      // Fetch hourly data
      const hourlyResponse = await fetch(`${API_ENDPOINTS.manager.reports.hourly}?${params}`);
      if (!hourlyResponse.ok) throw new Error('Failed to fetch hourly data');
      const hourlyJson = await hourlyResponse.json();
      
      setHourlyData((hourlyJson.data || []).map(item => ({
        hour: `${item.hour}:00`,
        orders: parseInt(item.orders || 0)
      })));

    } catch (err) {
      setError(err.message);
      console.error('Error fetching trends data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Ordering Trends</h2>
        <p className="text-gray-600 mt-1">Analyze sales patterns and popular items</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Date Range Selector */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Apply Filter'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-green-600">
            ${salesData.reduce((sum, day) => sum + day.sales, 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {salesData.length} days
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600">
            {salesData.reduce((sum, day) => sum + day.orders, 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {salesData.length > 0 ? (salesData.reduce((sum, day) => sum + day.orders, 0) / salesData.length).toFixed(1) : 0} avg/day
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-1">Avg Order Value</div>
          <div className="text-3xl font-bold text-purple-600">
            ${salesData.length > 0 && salesData.reduce((sum, day) => sum + day.orders, 0) > 0 
              ? (salesData.reduce((sum, day) => sum + day.sales, 0) / salesData.reduce((sum, day) => sum + day.orders, 0)).toFixed(2)
              : '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">per transaction</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 mb-1">Peak Hour</div>
          <div className="text-3xl font-bold text-orange-600">
            {hourlyData.length > 0 
              ? hourlyData.reduce((max, hour) => hour.orders > max.orders ? hour : max, hourlyData[0]).hour
              : 'N/A'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {hourlyData.length > 0 
              ? `${hourlyData.reduce((max, hour) => hour.orders > max.orders ? hour : max, hourlyData[0]).orders} orders`
              : 'No data'}
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Orders', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#8B5CF6" strokeWidth={2} name="Revenue ($)" />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#06B6D4" strokeWidth={2} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Items Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Top 5 Popular Items</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {popularItems.map((item, index) => (
              <tr key={item.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold">
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.orders}</td>
                <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">${item.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
