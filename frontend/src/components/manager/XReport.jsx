import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * X-Report Component (Current Session Report)
 * Industry-standard report showing hourly sales activities for the current day.
 * Helps managers determine actual sales volume during "rush" or "lull" periods.
 * No side effects - can be run as often as desired without affecting the system.
 */
export default function XReport() {
  const [reportPreview, setReportPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to get current UTC date string (YYYY-MM-DD)
  const getUTCDateString = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Helper to get current UTC time string
  const getUTCTimeString = () => {
    const now = new Date();
    return now.toISOString().split('T')[1].split('.')[0] + ' UTC';
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    // Use UTC date since orders are stored in UTC
    const currentDate = getUTCDateString();
    
    try {
      // Fetch from multiple endpoints like Ordering Trends does
      const params = new URLSearchParams({
        startDate: currentDate,
        endDate: currentDate
      });

      // Fetch X-Report summary data
      const xreportResponse = await fetch(
        `${API_ENDPOINTS.manager.reports.xreport}?date=${currentDate}`
      );
      
      if (!xreportResponse.ok) {
        throw new Error('Failed to fetch X-Report data');
      }
      const xreportData = await xreportResponse.json();

      // Fetch hourly data from the working hourly endpoint
      const hourlyResponse = await fetch(`${API_ENDPOINTS.manager.reports.hourly}?${params}`);
      let hourlyData = [];
      if (hourlyResponse.ok) {
        const hourlyJson = await hourlyResponse.json();
        hourlyData = (hourlyJson.data || []).map(item => ({
          hour: parseInt(item.hour),
          orders: parseInt(item.orders || 0)
        }));
      }

      // Fetch popular items from the working popular items endpoint
      const itemsResponse = await fetch(`${API_ENDPOINTS.manager.reports.popularItems}?${params}`);
      let topItems = [];
      if (itemsResponse.ok) {
        const itemsJson = await itemsResponse.json();
        topItems = (itemsJson.items || []).slice(0, 5).map(item => ({
          name: item.name,
          quantity: parseInt(item.orders || 0),
          revenue: parseFloat(item.revenue || 0)
        }));
      }

      // Transform API response to match component format
      setReportPreview({
        date: currentDate,
        generatedAt: new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC',
        currentTime: getUTCTimeString(),
        
        // Summary totals
        summary: {
          totalSales: parseFloat(xreportData.sales?.gross_sales || 0),
          totalTransactions: parseInt(xreportData.transactions?.totalTransactions || 0),
        },
        
        // Payment methods breakdown
        paymentMethods: {
          cash: {
            count: parseInt(xreportData.transactions?.cash?.count || 0),
            amount: parseFloat(xreportData.transactions?.cash?.amount || 0)
          },
          credit: {
            count: parseInt(xreportData.transactions?.credit?.count || 0),
            amount: parseFloat(xreportData.transactions?.credit?.amount || 0)
          },
          debit: {
            count: parseInt(xreportData.transactions?.debit?.count || 0),
            amount: parseFloat(xreportData.transactions?.debit?.amount || 0)
          },
        },
        
        // Hourly breakdown from working endpoint
        hourlyBreakdown: hourlyData.filter(hour => hour.orders > 0).map(hour => ({
          hour: hour.hour,
          timeLabel: `${String(hour.hour).padStart(2, '0')}:00 - ${String(hour.hour).padStart(2, '0')}:59`,
          sales: 0, // Hourly endpoint doesn't provide sales breakdown
          transactions: hour.orders,
          avgTransaction: 0
        })),
        
        // Top sellers from working endpoint
        topSellers: topItems,
      });
    } catch (err) {
      setError(err.message);
      console.error('Error generating X-Report:', err);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const exportReport = () => {
    if (!reportPreview) return;
    
    const reportText = `
X-REPORT - ShareNook
===========================================
Current Session Report
Report Date: ${new Date(reportPreview.date).toLocaleDateString()}
Generated: ${new Date().toLocaleString()}

SALES SUMMARY (Today)
---------------------
Total Sales:        $${reportPreview.summary.totalSales.toFixed(2)}
Total Transactions: ${reportPreview.summary.totalTransactions}

PAYMENT METHODS
---------------
Cash:         ${reportPreview.paymentMethods.cash.count} trans, $${reportPreview.paymentMethods.cash.amount.toFixed(2)}
Credit Card:  ${reportPreview.paymentMethods.credit.count} trans, $${reportPreview.paymentMethods.credit.amount.toFixed(2)}
Debit Card:   ${reportPreview.paymentMethods.debit.count} trans, $${reportPreview.paymentMethods.debit.amount.toFixed(2)}

ORDERS BY HOUR
--------------
${reportPreview.hourlyBreakdown.length > 0 
  ? reportPreview.hourlyBreakdown.map(hour => 
    `${hour.timeLabel.padEnd(15)} | ${hour.transactions.toString().padStart(3)} orders`
  ).join('\n')
  : 'No hourly data available for today'}

TOP SELLING ITEMS (Today)
-------------------------
${reportPreview.topSellers.length > 0 
  ? reportPreview.topSellers.map(item => 
    `${item.name.padEnd(30)} ${item.quantity.toString().padStart(3)} sold | $${item.revenue.toFixed(2)}`
  ).join('\n')
  : 'No sales data available for today'}

---
Report generated on ${new Date().toLocaleString()}
This is an X-Report (current session) and does not close the business day.
Can be run as often as desired without side effects.
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `X-Report_${reportPreview.date.replace(/-/g, '')}_${new Date().getHours()}${new Date().getMinutes()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">X-Report (Current Session)</h2>
        <p className="text-gray-600 mt-1">
          Hourly sales activities for today - helps identify rush periods and sales volume
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">💹</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Industry-Standard X-Report</h3>
            <p className="text-sm text-blue-700 mt-1">
              Shows hourly sales activities to determine if perceived "rush" or "lull" periods match actual sales volume.
              Includes sales totals and payment methods. No side effects - run as often as needed.
            </p>
          </div>
        </div>
      </div>

      {/* Generate Report Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Today's Sales Activity</h3>
            <p className="text-sm text-gray-600 mt-1">Generate a report to view current session data</p>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 text-lg"
          >
            {loading ? '⏳ Generating...' : '📊 Generate X-Report'}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {reportPreview && (
        <div className="space-y-6 print:space-y-4">
          {/* Report Header */}
          <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
            <div className="text-center mb-6 print:mb-4">
              <h3 className="text-2xl font-bold text-gray-900">X-REPORT</h3>
              <p className="text-lg text-gray-700">ShareNook - Current Session Report</p>
              <div className="mt-2 text-sm text-gray-600">
                <p>Report Date: {new Date(reportPreview.date).toLocaleDateString()}</p>
                <p>Generated: {new Date().toLocaleString()}</p>
              </div>
              <div className="mt-3 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                💹 Current Session - Day Not Closed
              </div>
            </div>

            {/* Sales Summary */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-lg font-bold text-gray-800 mb-3">Sales Summary (Today)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Sales</div>
                  <div className="text-3xl font-bold text-green-600">${reportPreview.summary.totalSales.toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Transactions</div>
                  <div className="text-3xl font-bold text-blue-600">{reportPreview.summary.totalTransactions}</div>
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
                <div className="text-2xl font-bold text-green-600">${reportPreview.paymentMethods.cash.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">{reportPreview.paymentMethods.cash.count} transactions</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Credit Card</div>
                <div className="text-2xl font-bold text-blue-600">${reportPreview.paymentMethods.credit.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">{reportPreview.paymentMethods.credit.count} transactions</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Debit Card</div>
                <div className="text-2xl font-bold text-purple-600">${reportPreview.paymentMethods.debit.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">{reportPreview.paymentMethods.debit.count} transactions</div>
              </div>
            </div>
          </div>

          {/* Hourly Breakdown - KEY FEATURE */}
          <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
            <h4 className="text-lg font-bold text-gray-800 mb-3">⏰ Orders by Hour</h4>
            <p className="text-sm text-gray-600 mb-4">Identify rush periods throughout the day</p>
            {reportPreview.hourlyBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold">Hour</th>
                      <th className="text-right py-3 px-4 font-semibold">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportPreview.hourlyBreakdown.map((hour, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{hour.timeLabel}</td>
                        <td className="text-right py-3 px-4 font-semibold">{hour.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hourly data available for today</p>
            )}
          </div>

          {/* Top Sellers */}
          <div className="bg-white p-6 rounded-lg shadow-md print:shadow-none">
            <h4 className="text-lg font-bold text-gray-800 mb-3">Top 5 Selling Items (Today)</h4>
            {reportPreview.topSellers.length > 0 ? (
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
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-lg shadow-md print:hidden">
            <div className="flex gap-4">
              <button
                onClick={printReport}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                🖨️ Print Report
              </button>
              <button
                onClick={exportReport}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                💾 Export Report
              </button>
              <button
                onClick={() => setReportPreview(null)}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              >
                🔄 New Report
              </button>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Industry-Standard X-Report:</strong> Shows hourly sales activities for today without side effects. 
                Run as often as needed to check if "rush" or "lull" feelings match actual sales volume. 
                Use Z-Report at end of day to finalize and close.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Preview State */}
      {!reportPreview && !loading && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <div className="text-6xl mb-4">💹</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Generate X-Report</h3>
          <p className="text-gray-600 mb-4">Click "Generate X-Report" to view hourly sales activities for today</p>
          <div className="text-sm text-gray-500 max-w-2xl mx-auto">
            <p className="mb-2">✓ Shows total sales and transactions</p>
            <p className="mb-2">✓ Hourly breakdown to identify rush periods</p>
            <p className="mb-2">✓ Payment method distribution</p>
            <p>✓ No side effects - run as often as needed</p>
          </div>
        </div>
      )}
    </div>
  );
}
