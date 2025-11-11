// API Configuration
// Determines the correct API base URL based on environment

const getApiBaseUrl = () => {
  // Check if VITE_API_URL is defined in environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (GitHub Pages), return your deployed backend URL
  if (import.meta.env.PROD) {
    // TODO: Replace with your actual deployed backend URL
    // For now, this will need to be updated when you deploy the backend
    return 'http://localhost:3001'; // Change this to your production backend URL
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
};
