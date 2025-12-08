// API Configuration
// Determines the correct API base URL based on environment

const getApiBaseUrl = () => {
  // Check if VITE_API_URL is defined in environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (GitHub Pages), backend needs to be deployed separately
  if (import.meta.env.PROD) {
    // TODO: Deploy backend and update this URL
    // Options: Railway, Render, AWS, Azure, Google Cloud
    // For now, returning a placeholder that will show a clear error
    console.warn('⚠️ Backend not configured for production. Deploy backend and set VITE_API_URL environment variable.');
    return 'https://backend-not-deployed.example.com'; // This will fail with clear message
  }
  
  // In development, use localhost
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  menu: `${API_BASE_URL}/api/menu`,
  weather: `${API_BASE_URL}/api/weather`,
  health: `${API_BASE_URL}/api/health`,
  translate: `${API_BASE_URL}/api/translate`,
  customerLogin: `${API_BASE_URL}/api/customer/login`,
  customerSignup: `${API_BASE_URL}/api/customer/signup`,
  customerSetPin: `${API_BASE_URL}/api/customer/set-pin`,
  customerCheck: `${API_BASE_URL}/api/customer/check`,
  customers: `${API_BASE_URL}/api/customers`,
  orders: `${API_BASE_URL}/api/orders`,
  
  // Manager endpoints
  manager: {
    inventory: `${API_BASE_URL}/api/manager/inventory`,
    menu: `${API_BASE_URL}/api/manager/menu`,
    employees: `${API_BASE_URL}/api/manager/employees`,
    reports: {
      sales: `${API_BASE_URL}/api/manager/reports/sales`,
      hourly: `${API_BASE_URL}/api/manager/reports/hourly`,
      categories: `${API_BASE_URL}/api/manager/reports/categories`,
      popularItems: `${API_BASE_URL}/api/manager/reports/popular-items`,
      product: `${API_BASE_URL}/api/manager/reports/product`,
      productUsage: `${API_BASE_URL}/api/manager/reports/product-usage`,
      employee: `${API_BASE_URL}/api/manager/reports/employee`,
      inventory: `${API_BASE_URL}/api/manager/reports/inventory`,
      xreport: `${API_BASE_URL}/api/manager/reports/xreport`,
      zreport: `${API_BASE_URL}/api/manager/reports/zreport`,
      finalizeZReport: `${API_BASE_URL}/api/manager/reports/zreport/finalize`,
    }
  }
};

