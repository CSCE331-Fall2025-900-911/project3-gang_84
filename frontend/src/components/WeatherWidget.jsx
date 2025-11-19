import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

/**
 * Compact Weather Widget
 * Shows current temperature with icon and 3-day forecast on hover
 */
export default function WeatherWidget({ highContrast, onWeatherUpdate }) {
  const [weatherData, setWeatherData] = useState(null);
  const [showForecast, setShowForecast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.weather);
      if (!response.ok) throw new Error('Failed to fetch weather');
      const data = await response.json();
      setWeatherData(data);
      // Notify parent component of weather update
      if (onWeatherUpdate && data.current) {
        onWeatherUpdate(data.current);
      }
      setLoading(false);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('sunny') || cond.includes('clear')) return '☀️';
    if (cond.includes('cloud')) return '☁️';
    if (cond.includes('rain')) return '🌧️';
    if (cond.includes('snow')) return '❄️';
    if (cond.includes('thunder') || cond.includes('storm')) return '⛈️';
    if (cond.includes('fog') || cond.includes('mist')) return '🌫️';
    return '🌤️';
  };

  if (loading || !weatherData) {
    return (
      <div className={`flex items-center gap-2 ${highContrast ? 'text-yellow-400' : 'text-gray-700'}`}>
        <span className="text-xl">🌤️</span>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const current = weatherData.current;
  const forecast = weatherData.forecast?.forecastday || [];

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowForecast(true)}
      onMouseLeave={() => setShowForecast(false)}
    >
      {/* Current Weather Display */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
        highContrast 
          ? 'text-yellow-400 hover:bg-gray-800' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}>
        <span className="text-2xl">{getWeatherIcon(current.condition.text)}</span>
        <div className="text-left">
          <div className={`text-lg font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            {Math.round(current.temp_f)}°F
          </div>
          <div className={`text-xs ${highContrast ? 'text-white' : 'text-gray-600'}`}>
            {weatherData.location.name}
          </div>
        </div>
      </div>

      {/* 3-Day Forecast Popup (on hover) */}
      {showForecast && forecast.length > 0 && (
        <div 
          className={`absolute top-full right-0 mt-2 rounded-xl shadow-2xl p-4 min-w-[300px] z-50 ${
            highContrast 
              ? 'bg-gray-900 border-4 border-yellow-400' 
              : 'bg-white border border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-bold mb-3 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            3-Day Forecast
          </h3>
          <div className="space-y-2">
            {forecast.slice(0, 3).map((day, index) => {
              const date = new Date(day.date);
              const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <div 
                  key={day.date}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    highContrast 
                      ? 'bg-gray-800 border-2 border-yellow-400' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getWeatherIcon(day.day.condition.text)}</span>
                    <div>
                      <div className={`font-semibold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
                        {dayName}
                      </div>
                      <div className={`text-xs ${highContrast ? 'text-white' : 'text-gray-600'}`}>
                        {day.day.condition.text}
                      </div>
                    </div>
                  </div>
                  <div className={`text-right ${highContrast ? 'text-white' : 'text-gray-700'}`}>
                    <div className="font-bold">{Math.round(day.day.maxtemp_f)}°</div>
                    <div className="text-sm text-gray-500">{Math.round(day.day.mintemp_f)}°</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
