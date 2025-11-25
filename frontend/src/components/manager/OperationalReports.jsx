import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Operational Reports Component
 * Generate various operational reports for management
 */
export default function OperationalReports() {
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2025-11-24');
  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    { value: 'sales', label: 'Sales Summary Report', description: 'Total sales, orders, and revenue breakdown' },
    { value: 'product', label: 'Product Performance Report', description: 'Best and worst selling items' },
    { value: 'hourly', label: 'Hourly Performance Report', description: 'Sales patterns by hour of day' },
    { value: 'employee', label: 'Employee Performance Report', description: 'Orders processed by each employee' },
    { value: 'inventory', label: 'Inventory Usage Report', description: 'Ingredient consumption and waste' },
    { value: 'xreport', label: 'X Report (Current Session)', description: 'Sales during current shift' },
  ];

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint;
      let params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });

      // Map report type to API endpoint
      switch(reportType) {
        case 'sales':
          endpoint = `${API_ENDPOINTS.manager.reports.sales}?${params}`;
          break;
        case 'product':
          endpoint = `${API_ENDPOINTS.manager.reports.product}?${params}`;
          break;
        case 'hourly':
          endpoint = `${API_ENDPOINTS.manager.reports.hourly}?${params}`;
          break;
        case 'employee':
          endpoint = `${API_ENDPOINTS.manager.reports.employee}?${params}`;
          break;
        case 'inventory':
          endpoint = `${API_ENDPOINTS.manager.reports.inventory}`;
          break;
        case 'xreport':
          endpoint = `${API_ENDPOINTS.manager.reports.xreport}?date=${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      
      // Transform API response to match component format
      setReportData({
        generatedAt: new Date().toLocaleString(),
        type: reportType,
        dateRange: { start: startDate, end: endDate },
        summary: transformSummary(data, reportType),
        details: transformDetails(data, reportType)
      });
    } catch (err) {
      setError(err.message);
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const transformSummary = (data, type) => {
    switch(type) {
      case 'sales':
        return {
          totalRevenue: parseFloat(data.summary?.totalRevenue || 0),
          totalOrders: parseInt(data.summary?.totalOrders || 0),
          avgOrderValue: parseFloat(data.summary?.avgOrderValue || 0),
          totalCustomers: parseInt(data.summary?.totalCustomers || 0)
        };
      case 'xreport':
        return {
          totalRevenue: parseFloat(data.sales?.gross_sales || 0),
          totalOrders: parseInt(data.sales?.total_transactions || 0),
          avgOrderValue: data.sales?.total_transactions > 0 ? 
            (parseFloat(data.sales?.gross_sales || 0) / parseInt(data.sales?.total_transactions || 1)) : 0,
          totalCustomers: 0
        };
      default:
        // For other reports, derive summary from details
        const details = data.data || data.items || data.employees || [];
        return {
          totalRevenue: details.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0),
          totalOrders: details.reduce((sum, item) => sum + parseInt(item.orders || item.count || 0), 0),
          avgOrderValue: 0,
          totalCustomers: 0
        };
    }
  };

  const transformDetails = (data, type) => {
    switch(type) {
      case 'sales':
        return data.data || [];
      case 'product':
        return data.items || [];
      case 'hourly':
        return data.data || [];
      case 'employee':
        return data.employees || [];
      case 'inventory':
        return (data.items || []).map(item => ({
          item: item.ingredientname,
          current: item.stock,
          status: item.status,
          reorderLevel: item.reorder_level
        }));
      case 'xreport':
        // Transform X-Report data to table format
        return data.products?.categories || [];
      default:
        return [];
    }
  };

  const exportReport = (format) => {
    console.log(`Exporting report as ${format}`);
    alert(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Operational Reports</h2>
        <p className="text-gray-600 mt-1">Generate and analyze business reports</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Report Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {reportTypes.find(t => t.value === reportType)?.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {reportTypes.find(t => t.value === reportData.type)?.label}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Generated on: {reportData.generatedAt}
                </p>
                <p className="text-sm text-gray-500">
                  Period: {reportData.dateRange.start} to {reportData.dateRange.end}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportReport('pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  📄 Export PDF
                </button>
                <button
                  onClick={() => exportReport('excel')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  📊 Export Excel
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">${reportData.summary.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalOrders}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Avg Order Value</div>
                <div className="text-2xl font-bold text-purple-600">${reportData.summary.avgOrderValue.toFixed(2)}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Customers</div>
                <div className="text-2xl font-bold text-orange-600">{reportData.summary.totalCustomers}</div>
              </div>
            </div>
          </div>

          {/* Detailed Report Data */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-bold text-gray-800">Detailed Breakdown</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData.details[0] || {}).map(key => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.details.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap">
                          {typeof value === 'number' && value > 100 ? `$${value.toFixed(2)}` : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Report State */}
      {!reportData && !loading && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Report Generated</h3>
          <p className="text-gray-600">Select a report type and date range, then click "Generate Report"</p>
        </div>
      )}
    </div>
  );
}
