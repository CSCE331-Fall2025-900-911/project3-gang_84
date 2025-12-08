import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Z-Report Component (End of Day Report)
 * Final daily report that closes out the day's transactions
 */
export default function ZReport() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportPreview, setReportPreview] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.manager.reports.zreport}?date=${reportDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Z-Report data');
      }

      const data = await response.json();
      
      // Check if already finalized
      if (data.isFinalized) {
        setIsFinalized(true);
      }
      
      // Transform API response to match component format
      setReportPreview({
        date: data.date,
        generatedAt: new Date().toLocaleString(),
        openingTime: '08:00 AM',
        closingTime: new Date().toLocaleTimeString(),
        cashier: 'System Admin',
        
        sales: {
          grossSales: parseFloat(data.sales?.gross_sales || 0),
          discounts: parseFloat(data.sales?.total_discounts || 0),
          taxes: parseFloat(data.sales?.total_taxes || 0),
          netSales: parseFloat(data.sales?.net_sales || 0),
        },
        
        transactions: {
          totalTransactions: parseInt(data.transactions?.totalTransactions || 0),
          cash: {
            count: parseInt(data.transactions?.cash?.count || 0),
            amount: parseFloat(data.transactions?.cash?.amount || 0)
          },
          credit: {
            count: parseInt(data.transactions?.credit?.count || 0),
            amount: parseFloat(data.transactions?.credit?.amount || 0)
          },
          debit: {
            count: parseInt(data.transactions?.debit?.count || 0),
            amount: parseFloat(data.transactions?.debit?.amount || 0)
          },
        },
        
        products: {
          totalItemsSold: parseInt(data.products?.totalItemsSold || 0),
          categories: (data.products?.categories || []).map(cat => ({
            name: cat.name,
            items: parseInt(cat.items || 0),
            revenue: parseFloat(cat.revenue || 0)
          })),
        },
        
        topSellers: (data.topSellers || []).map(item => ({
          name: item.name,
          quantity: parseInt(item.quantity || 0),
          revenue: parseFloat(item.revenue || 0)
        })),
      });
    } catch (err) {
      setError(err.message);
      console.error('Error generating Z-Report:', err);
    } finally {
      setLoading(false);
    }
  };

  const finalizeReport = async () => {
    if (window.confirm(
      'WARNING: Finalizing the Z-Report will permanently close the day and save totals to daily_totals table. ' +
      'This action should only be performed once at the end of the business day. ' +
      'Are you sure you want to continue?'
    )) {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(API_ENDPOINTS.manager.reports.finalizeZReport, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date: reportDate }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to finalize Z-Report');
        }
        
        const data = await response.json();
        setIsFinalized(true);
        alert(`Z-Report finalized successfully!\n\nReport Date: ${data.data.reportDate}\nTotal Sales: $${data.data.totalSales.toFixed(2)}\nTotal Orders: ${data.data.totalOrders}\n\nDay has been closed and saved to daily_totals table.`);
      } catch (err) {
        setError(err.message);
        console.error('Error finalizing Z-Report:', err);
        alert(`Failed to finalize Z-Report: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Z-Report (End of Day)</h2>
        <p className="text-gray-600 mt-1">Generate final daily report and close business day</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Finalizing the report saves a permanent summary of the day's totals. 
              This action should only be performed once at the end of the business day.
            </p>
          </div>
        </div>
      </div>

      {/* Generate Report Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Generate Today's Final Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={generatePreview}
              disabled={loading || isFinalized}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400"
            >
              {loading ? 'Generating Preview...' : 'Generate Preview'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportPreview && (
        <div className="space-y-6 print:space-y-4">
          {/* Report Header */}
          <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
            <div className="text-center mb-6 print:mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Z-REPORT</h3>
              <p className="text-lg text-gray-700">ShareNook - End of Day Report</p>
              <div className="mt-2 text-sm text-gray-600">
                <p>Report Date: {new Date(reportPreview.date).toLocaleDateString()}</p>
                <p>Generated: {reportPreview.generatedAt}</p>
                <p>Business Hours: {reportPreview.openingTime} - {reportPreview.closingTime}</p>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-lg font-bold text-gray-800 mb-3">Sales Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Gross Sales:</span>
                  <span className="font-semibold">${reportPreview.sales.grossSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Total Transactions:</span>
                  <span className="font-semibold">{reportPreview.transactions.totalTransactions}</span>
                </div>
                <div className="flex justify-between py-2 text-red-600">
                  <span>Discounts:</span>
                  <span className="font-semibold">-${reportPreview.sales.discounts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Items Sold:</span>
                  <span className="font-semibold">{reportPreview.products.totalItemsSold}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Taxes:</span>
                  <span className="font-semibold">${reportPreview.sales.taxes.toFixed(2)}</span>
                </div>
                <div></div>
                <div className="flex justify-between py-2 border-t-2 border-gray-300 text-lg">
                  <span className="font-bold">Net Sales:</span>
                  <span className="font-bold text-green-600">${reportPreview.sales.netSales.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
            <h4 className="text-lg font-bold text-gray-800 mb-3">Payment Methods</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Cash</div>
                <div className="text-2xl font-bold text-green-600">${reportPreview.transactions.cash.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">{reportPreview.transactions.cash.count} transactions</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Credit Card</div>
                <div className="text-2xl font-bold text-blue-600">${reportPreview.transactions.credit.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">{reportPreview.transactions.credit.count} transactions</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Debit Card</div>
                <div className="text-2xl font-bold text-purple-600">${reportPreview.transactions.debit.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">{reportPreview.transactions.debit.count} transactions</div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
            <h4 className="text-lg font-bold text-gray-800 mb-3">Sales by Category</h4>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Items Sold</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportPreview.products.categories.map((cat, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2">{cat.name}</td>
                    <td className="text-right py-2">{cat.items}</td>
                    <td className="text-right py-2 font-semibold">${cat.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Sellers */}
          <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
            <h4 className="text-lg font-bold text-gray-800 mb-3">Top Selling Items</h4>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportPreview.topSellers.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2">{item.name}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2 font-semibold">${item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-lg shadow-md print:hidden">
            {isFinalized && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-semibold">⚠️ This report has already been finalized in the daily_totals table.</p>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={printReport}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                🖨️ Print Report
              </button>
              <button
                onClick={finalizeReport}
                disabled={isFinalized || loading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400"
              >
                {isFinalized ? '✓ Already Finalized' : '🔒 Finalize and Close Day'}
              </button>
            </div>
            {isFinalized && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">✓ Z-Report has been finalized and saved permanently to daily_totals table (matches Java Project 2).</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Preview State */}
      {!reportPreview && !loading && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Report Preview</h3>
          <p className="text-gray-600">Click "Generate Preview" to create the Z-Report for today</p>
        </div>
      )}
    </div>
  );
}
