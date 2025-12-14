import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

/**
 * Operational Reports Component
 * Generate various operational reports for management
 */
export default function OperationalReports() {
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to format cell values nicely
  const formatCellValue = (key, value) => {
    const keyLower = key.toLowerCase();
    
    // Format dates
    if (keyLower === 'date' || keyLower.includes('date')) {
      if (typeof value === 'string' && value.includes('T')) {
        return new Date(value).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      return value;
    }
    
    // Skip currency formatting for quantity/usage fields
    const nonCurrencyFields = ['totalused', 'total_used', 'quantity', 'stock', 'count', 'unit'];
    if (nonCurrencyFields.some(f => keyLower === f)) {
      if (typeof value === 'number' || (!isNaN(parseFloat(value)) && keyLower !== 'unit')) {
        return parseFloat(value).toFixed(2);
      }
      return value;
    }
    
    // Format orders as integers
    if (keyLower === 'orders') {
      return parseInt(value) || 0;
    }
    
    // Format currency/revenue values (be more specific)
    const currencyFields = ['revenue', 'totalcost', 'total_revenue', 'price', 'avg_price', 'avg_order_value', 'sales'];
    if (currencyFields.some(f => keyLower === f || keyLower.endsWith(f))) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return `$${num.toFixed(2)}`;
      }
    }
    
    // Format average values
    if (keyLower.includes('avg') || keyLower.includes('average')) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return `$${num.toFixed(2)}`;
      }
    }
    
    // Format percentages
    if (keyLower.includes('percent')) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return `${num.toFixed(1)}%`;
      }
    }
    
    // Format other numbers
    if (typeof value === 'number') {
      // Check if it looks like a decimal that should be currency
      if (value % 1 !== 0 && value < 10000) {
        return value.toFixed(2);
      }
      return value.toLocaleString();
    }
    
    return value;
  };

  const reportTypes = [
    { value: 'sales', label: 'Sales Summary Report', description: 'Total sales, orders, and revenue breakdown' },
    { value: 'product', label: 'Product Performance Report', description: 'Best and worst selling items' },
    { value: 'productUsage', label: 'Product Usage Report (Ingredient Consumption)', description: 'Ingredient usage over date range' },
    { value: 'hourly', label: 'Hourly Performance Report', description: 'Sales patterns by hour of day' },
    { value: 'employee', label: 'Employee Performance Report', description: 'Orders processed by each employee' },
    { value: 'inventory', label: 'Inventory Status Report', description: 'Current stock levels and reorder status' },
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
        case 'productUsage':
          endpoint = `${API_ENDPOINTS.manager.reports.productUsage}?${params}`;
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
        details: transformDetails(data, reportType),
        kiosk: data.kiosk || null // Store kiosk data for employee report
      });
    } catch (err) {
      setError(err.message);
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const transformSummary = (data, type) => {
    // If the API returns a summary object, use it directly
    if (data.summary) {
      return {
        totalRevenue: parseFloat(data.summary.totalRevenue || 0),
        totalOrders: parseInt(data.summary.totalOrders || 0),
        avgOrderValue: parseFloat(data.summary.avgOrderValue || 0),
        totalCustomers: parseInt(data.summary.totalCustomers || 0)
      };
    }
    
    // Fallback: derive summary from details for reports without summary
    const details = data.data || data.items || data.employees || [];
    const totalRevenue = details.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);
    const totalOrders = details.reduce((sum, item) => sum + parseInt(item.orders || item.count || 0), 0);
    return {
      totalRevenue: totalRevenue,
      totalOrders: totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalCustomers: 0 // Cannot determine without API summary
    };
  };

  const transformDetails = (data, type) => {
    switch(type) {
      case 'sales':
        return data.data || [];
      case 'product':
        return data.items || [];
      case 'productUsage':
        return (data.data || []).map(item => ({
          ingredientName: item.ingredientname,
          totalUsed: parseFloat(item.total_used || 0).toFixed(2),
          unit: item.unit
        }));
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
      default:
        return [];
    }
  };

  const exportReport = (format) => {
    if (!reportData) {
      alert('No report data to export');
      return;
    }

    try {
      if (format === 'pdf') {
        exportToPDF();
      } else if (format === 'excel') {
        exportToExcel();
      }
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      alert(`Failed to export report as ${format.toUpperCase()}. Error: ${error.message}`);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let currentY = 20;
      
      // Add title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(reportTypes.find(t => t.value === reportData.type)?.label || 'Operational Report', 14, currentY);
      currentY += 8;
      
      // Add metadata
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${reportData.generatedAt}`, 14, currentY);
      currentY += 6;
      doc.text(`Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}`, 14, currentY);
      currentY += 10;
      
      // Add summary section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Summary Statistics', 14, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Summary table
      const summaryData = [
        ['Total Revenue', `$${reportData.summary.totalRevenue.toFixed(2)}`],
        ['Total Orders', reportData.summary.totalOrders.toString()],
        ['Average Order Value', `$${reportData.summary.avgOrderValue.toFixed(2)}`],
        ['Total Customers', reportData.summary.totalCustomers.toString()]
      ];
      
      autoTable(doc, {
        body: summaryData,
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { halign: 'right', cellWidth: 60 }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      // Add detailed data table
      if (reportData.details && reportData.details.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Breakdown', 14, currentY);
        currentY += 8;
        
        // Calculate additional statistics
        const totalItems = reportData.details.length;
        const itemsWithRevenue = reportData.details.filter(item => 
          (item.revenue || item.total_revenue || item.sales || 0) > 0
        );
        
        if (itemsWithRevenue.length > 0) {
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          doc.text(`Total Items: ${totalItems}`, 14, currentY);
          currentY += 5;
        }
        
        // Get column headers from first row keys
        const headers = Object.keys(reportData.details[0]).map(key => 
          key.replace(/_/g, ' ').toUpperCase()
        );
        
        // Get table data with better formatting
        const tableData = reportData.details.map(row => 
          Object.entries(row).map(([key, value]) => {
            // Format currency columns
            if ((key.includes('revenue') || key.includes('price') || key.includes('total') || key.includes('sales')) 
                && typeof value === 'number') {
              return `$${value.toFixed(2)}`;
            }
            // Format percentage columns
            if (key.includes('percent') && typeof value === 'number') {
              return `${value.toFixed(1)}%`;
            }
            // Format regular numbers
            if (typeof value === 'number') {
              return value.toLocaleString();
            }
          return value || '-';
        })
      );
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: currentY,
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: { 
          fillColor: [147, 51, 234], 
          textColor: 255, 
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Add page numbers
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
          }
        }
      });        // Add statistics summary at the end if there's data with revenue
        if (itemsWithRevenue.length > 0) {
          currentY = doc.lastAutoTable.finalY + 10;
          
          // Calculate percentages and top performers
          const revenueKey = Object.keys(reportData.details[0]).find(key => 
            key.includes('revenue') || key.includes('sales') || key.includes('total')
          );
          
          if (revenueKey) {
            const sortedByRevenue = [...reportData.details].sort((a, b) => 
              (b[revenueKey] || 0) - (a[revenueKey] || 0)
            );
            
            const topItem = sortedByRevenue[0];
            const topItemName = topItem.name || topItem.item || topItem.category || 'Unknown';
            const topItemRevenue = parseFloat(topItem[revenueKey]) || 0;
            const revenuePercentage = ((topItemRevenue / reportData.summary.totalRevenue) * 100).toFixed(1);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Key Insights:', 14, currentY);
            currentY += 6;
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(`• Top performer: ${topItemName} ($${topItemRevenue.toFixed(2)} - ${revenuePercentage}% of total)`, 14, currentY);
            currentY += 5;
            doc.text(`• Average revenue per item: $${(reportData.summary.totalRevenue / totalItems).toFixed(2)}`, 14, currentY);
          }
        }
      }
      
      // Generate filename and save
      const filename = `operational-report-${reportData.type}-${reportData.dateRange.start}-to-${reportData.dateRange.end}.pdf`;
      doc.save(filename);
      alert('Report exported as PDF successfully!');
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      throw error;
    }
  };
  
  const exportToExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet data with enhanced statistics
    const summaryData = [
      ['ShareTea Operational Report'],
      [''],
      ['Report Type:', reportTypes.find(t => t.value === reportData.type)?.label || 'Unknown'],
      ['Generated:', reportData.generatedAt],
      ['Period:', `${reportData.dateRange.start} to ${reportData.dateRange.end}`],
      [''],
      ['SUMMARY STATISTICS'],
      ['Metric', 'Value'],
      ['Total Revenue', reportData.summary.totalRevenue],
      ['Total Orders', reportData.summary.totalOrders],
      ['Average Order Value', reportData.summary.avgOrderValue],
      ['Total Customers', reportData.summary.totalCustomers],
    ];
    
    // Add additional insights if we have detail data
    if (reportData.details && reportData.details.length > 0) {
      summaryData.push(['']);
      summaryData.push(['ADDITIONAL INSIGHTS']);
      summaryData.push(['Total Items in Report', reportData.details.length]);
      
      // Calculate revenue-based insights
      const revenueKey = Object.keys(reportData.details[0]).find(key => 
        key.includes('revenue') || key.includes('sales') || key.includes('total')
      );
      
      if (revenueKey) {
        const sortedByRevenue = [...reportData.details].sort((a, b) => 
          (b[revenueKey] || 0) - (a[revenueKey] || 0)
        );
        
        const topItem = sortedByRevenue[0];
        const bottomItem = sortedByRevenue[sortedByRevenue.length - 1];
        const topItemName = topItem.name || topItem.item || topItem.category || 'Unknown';
        const bottomItemName = bottomItem.name || bottomItem.item || bottomItem.category || 'Unknown';
        
        summaryData.push(['Top Performer', `${topItemName} ($${(topItem[revenueKey] || 0).toFixed(2)})`]);
        summaryData.push(['Top Performer Revenue %', `${((topItem[revenueKey] || 0) / reportData.summary.totalRevenue * 100).toFixed(1)}%`]);
        summaryData.push(['Lowest Performer', `${bottomItemName} ($${(bottomItem[revenueKey] || 0).toFixed(2)})`]);
        summaryData.push(['Average Revenue per Item', reportData.summary.totalRevenue / reportData.details.length]);
      }
    }
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 40 }];
    
    // Style the summary sheet headers
    if (summarySheet['A1']) summarySheet['A1'].s = { font: { bold: true, sz: 16 } };
    if (summarySheet['A7']) summarySheet['A7'].s = { font: { bold: true } };
    
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Details sheet with enhanced data
    if (reportData.details && reportData.details.length > 0) {
      // Add calculated percentages if revenue data exists
      const enhancedDetails = reportData.details.map(item => {
        const enhanced = { ...item };
        
        // Find revenue column
        const revenueKey = Object.keys(item).find(key => 
          key.includes('revenue') || key.includes('sales') || key.includes('total')
        );
        
        if (revenueKey && reportData.summary.totalRevenue > 0) {
          enhanced[`${revenueKey}_percentage`] = 
            ((item[revenueKey] || 0) / reportData.summary.totalRevenue * 100).toFixed(2) + '%';
        }
        
        return enhanced;
      });
      
      const detailsSheet = XLSX.utils.json_to_sheet(enhancedDetails);
      
      // Auto-size columns
      const detailsCols = Object.keys(reportData.details[0]).map(() => ({ wch: 15 }));
      detailsSheet['!cols'] = detailsCols;
      
      XLSX.utils.book_append_sheet(wb, detailsSheet, 'Details');
      
      // Add a Top Performers sheet
      const revenueKey = Object.keys(reportData.details[0]).find(key => 
        key.includes('revenue') || key.includes('sales') || key.includes('total')
      );
      
      if (revenueKey) {
        const sortedByRevenue = [...reportData.details]
          .sort((a, b) => (b[revenueKey] || 0) - (a[revenueKey] || 0))
          .slice(0, 10); // Top 10
        
        const topPerformersData = sortedByRevenue.map((item, index) => ({
          Rank: index + 1,
          Name: item.name || item.item || item.category || 'Unknown',
          Revenue: item[revenueKey],
          'Percentage of Total': `${((item[revenueKey] || 0) / reportData.summary.totalRevenue * 100).toFixed(2)}%`,
          Orders: item.orders || item.count || '-'
        }));
        
        const topPerformersSheet = XLSX.utils.json_to_sheet(topPerformersData);
        topPerformersSheet['!cols'] = [
          { wch: 8 }, 
          { wch: 30 }, 
          { wch: 15 }, 
          { wch: 20 }, 
          { wch: 12 }
        ];
        
        XLSX.utils.book_append_sheet(wb, topPerformersSheet, 'Top Performers');
      }
    }
    
    // Generate filename
    const filename = `operational-report-${reportData.type}-${reportData.dateRange.start}-to-${reportData.dateRange.end}.xlsx`;
    
    // Save the Excel file
    XLSX.writeFile(wb, filename);
    alert('Report exported as Excel successfully!');
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

          {/* Charts for Sales Summary Report */}
          {reportData.type === 'sales' && reportData.details.length > 0 && (
            <div className="space-y-6 mt-6">
              {/* Daily Revenue Trend - Area Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Daily Revenue Trend</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={reportData.details.map(d => ({
                        ...d,
                        dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        revenue: parseFloat(d.revenue || 0)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dateLabel" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        formatter={(value, name) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Orders - Bar Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Daily Orders</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.details.map(d => ({
                        ...d,
                        dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        orders: parseInt(d.orders || 0)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dateLabel" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [parseInt(value), 'Orders']}
                      />
                      <Bar dataKey="orders" name="Orders" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Charts for Product Performance Report */}
          {reportData.type === 'product' && reportData.details.length > 0 && (
            <div className="space-y-6 mt-6">
              {/* Top 10 Products by Revenue - Horizontal Bar Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Top 10 Products by Revenue</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...reportData.details]
                        .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
                        .slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={110}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                        {[...reportData.details]
                          .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
                          .slice(0, 10)
                          .map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#a855f7', '#ec4899'][index % 10]} 
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Products by Orders - Horizontal Bar Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Top 10 Products by Orders</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...reportData.details]
                        .sort((a, b) => parseInt(b.orders) - parseInt(a.orders))
                        .slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={110}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [parseInt(value), 'Orders']}
                      />
                      <Bar dataKey="orders" name="Orders" radius={[0, 4, 4, 0]}>
                        {[...reportData.details]
                          .sort((a, b) => parseInt(b.orders) - parseInt(a.orders))
                          .slice(0, 10)
                          .map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a855f7', '#ec4899'][index % 10]} 
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Charts for Employee Performance Report */}
          {reportData.type === 'employee' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Kiosk vs Employee Sales - Pie Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Sales Distribution</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {(() => {
                        const employeeOrders = reportData.details.reduce((sum, emp) => sum + (parseInt(emp.orders) || 0), 0);
                        const summaryOrders = reportData.summary?.totalOrders || 0;
                        // If kiosk data is missing or zero, derive it from summary minus employee orders
                        let kioskOrders = parseInt(reportData.kiosk?.orders || 0);
                        if ((!kioskOrders || kioskOrders === 0) && summaryOrders > 0) {
                          const calc = summaryOrders - employeeOrders;
                          kioskOrders = calc > 0 ? calc : 0;
                        }
                        const kioskRevenue = parseFloat(reportData.kiosk?.revenue || 0);
                        const employeeRevenue = reportData.details.reduce((sum, emp) => sum + (parseFloat(emp.revenue) || 0), 0);

                        const pieData = [
                          { name: 'Kiosk (Self-Service)', value: kioskOrders, orders: kioskOrders, revenue: kioskRevenue },
                          { name: 'Employees', value: employeeOrders, orders: employeeOrders, revenue: employeeRevenue }
                        ];

                        return (
                          <>
                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                              <Cell fill="#8884d8" />
                              <Cell fill="#82ca9d" />
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [
                              `${parseInt(value)} orders — $${parseFloat((props.payload && props.payload.revenue) || 0).toFixed(2)}`,
                              name
                            ]} />
                            <Legend />
                          </>
                        );
                      })()}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Totals verification */}
                <div className="mt-4 text-sm text-gray-600">
                  {(() => {
                    const employeeOrders = reportData.details.reduce((sum, emp) => sum + (parseInt(emp.orders) || 0), 0);
                    const summaryOrders = reportData.summary?.totalOrders || 0;
                    let kioskOrders = parseInt(reportData.kiosk?.orders || 0);
                    if ((!kioskOrders || kioskOrders === 0) && summaryOrders > 0) {
                      kioskOrders = summaryOrders - employeeOrders;
                    }
                    const total = kioskOrders + employeeOrders;
                    const ok = total === summaryOrders;
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-4">
                          <div>Kiosk orders: <strong>{kioskOrders}</strong></div>
                          <div>Employee orders: <strong>{employeeOrders}</strong></div>
                          <div>Total (summary): <strong>{summaryOrders}</strong></div>
                        </div>
                        {!ok && (
                          <div className="text-red-600 text-xs">⚠ Sum mismatch: {total} ≠ {summaryOrders}</div>
                        )}
                        <div className="text-xs text-gray-400">Backend kiosk data: {JSON.stringify(reportData.kiosk || 'null')}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Top Employee Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Top Employee</h4>
                {(() => {
                  const topEmployee = [...reportData.details]
                    .filter(emp => parseFloat(emp.revenue) > 0)
                    .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))[0];
                  
                  if (!topEmployee) {
                    return (
                      <div className="flex items-center justify-center h-56 text-gray-500">
                        No employee sales in this period
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex flex-col items-center justify-center h-56">
                      <div className="text-6xl mb-4">🏆</div>
                      <div className="text-2xl font-bold text-gray-800">{topEmployee.name}</div>
                      <div className="text-sm text-gray-500 mb-4">{topEmployee.role}</div>
                      <div className="grid grid-cols-2 gap-6 mt-2">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">${parseFloat(topEmployee.revenue).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{parseInt(topEmployee.orders)}</div>
                          <div className="text-sm text-gray-500">Orders</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Bar Chart for Product Usage Report - Top 10 Ingredients */}
          {reportData.type === 'productUsage' && reportData.details.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Top 10 Ingredients by Usage</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...reportData.details]
                      .sort((a, b) => parseFloat(b.totalUsed) - parseFloat(a.totalUsed))
                      .slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="ingredientName" 
                      width={90}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [parseFloat(value).toFixed(2), 'Quantity Used']}
                    />
                    <Bar dataKey="totalUsed" name="Quantity Used" radius={[0, 4, 4, 0]}>
                      {[...reportData.details]
                        .sort((a, b) => parseFloat(b.totalUsed) - parseFloat(a.totalUsed))
                        .slice(0, 10)
                        .map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#FFBB28'][index % 10]} 
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts for Hourly Performance Report */}
          {reportData.type === 'hourly' && reportData.details.length > 0 && (
            <div className="space-y-6 mt-6">
              {/* Orders by Hour - Bar Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Orders by Hour of Day</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.details.map(d => ({
                        ...d,
                        hourLabel: `${parseInt(d.hour) % 12 || 12}${parseInt(d.hour) < 12 ? 'AM' : 'PM'}`
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hourLabel" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [parseInt(value), 'Orders']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Bar dataKey="orders" name="Orders" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Hour - Area Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Revenue by Hour of Day</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={reportData.details.map(d => ({
                        ...d,
                        hourLabel: `${parseInt(d.hour) % 12 || 12}${parseInt(d.hour) < 12 ? 'AM' : 'PM'}`,
                        revenue: parseFloat(d.revenue)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hourLabel" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        formatter={(value, name) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Combined Orders & Revenue - Line Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Orders vs Revenue Trend</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={reportData.details.map(d => ({
                        ...d,
                        hourLabel: `${parseInt(d.hour) % 12 || 12}${parseInt(d.hour) < 12 ? 'AM' : 'PM'}`,
                        revenue: parseFloat(d.revenue),
                        orders: parseInt(d.orders)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hourLabel" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'Revenue' ? `$${parseFloat(value).toFixed(2)}` : parseInt(value),
                          name
                        ]}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="orders" 
                        name="Orders" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        dot={{ fill: '#82ca9d' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

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
                      {Object.entries(row).map(([key, value], i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap">
                          {formatCellValue(key, value)}
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
