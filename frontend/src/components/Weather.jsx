import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

/**
 * Weather Component
 * Displays current weather and forecast using WeatherAPI.com
 */
export default function Weather() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drinks, setDrinks] = useState([
    // Default drinks to show immediately while fetching from API
    { name: 'Classic Milk Tea', price: '5.99', category: 'Milk series', type: 'hot' },
    { name: 'Mango Smoothie', price: '6.49', category: 'Ice blend', type: 'cold' },
    { name: 'Strawberry Fruit Tea', price: '5.49', category: 'Fruit series', type: 'cold' },
    { name: 'Hot Coffee', price: '4.99', category: 'Coffee', type: 'hot' },
  ]);

  useEffect(() => {
    fetchWeather();
    fetchDrinks();
  }, []);

  /**
   * Fetch drinks from database
   */
  const fetchDrinks = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.menu);
      if (!response.ok) {
        throw new Error('Failed to fetch drinks');
      }
      const data = await response.json();
      // The backend sends { categories: [], menu_items: [], toppings: [], sweetness_options: [], ice_options: [] }
      setDrinks(data.menu_items || []);
    } catch (err) {
      console.error('Failed to fetch drinks:', err);
      // Keep the default drinks if fetch fails
    }
  };

  /**
   * Get drink recommendation based on weather conditions
   * Uses actual drinks from the database
   */
  const getDrinkRecommendation = (temp, condition) => {
    const tempF = Math.round(temp);
    const isRainy = condition.toLowerCase().includes('rain');
    const isSnowy = condition.toLowerCase().includes('snow');
    
    // Filter drinks by category (exact match with database categories)
    const milkSeries = drinks.filter(d => d.category?.toLowerCase() === 'milk series');
    const coffeeSeries = drinks.filter(d => d.category?.toLowerCase() === 'coffee');
    const fruitSeries = drinks.filter(d => d.category?.toLowerCase() === 'fruit series');
    const iceBlend = drinks.filter(d => d.category?.toLowerCase() === 'ice blend');

    // Helper to get random drink from array
    const getRandomDrink = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    let recommendedDrink = null;
    let reason = '';
    let icon = '🧋';
    let color = 'from-amber-400 to-yellow-600';

    // Hot weather (> 75°F) - Recommend ice blend
    if (tempF > 75) {
      recommendedDrink = getRandomDrink(iceBlend);
      reason = 'Perfect icy refreshment for hot weather!';
      icon = '🧊';
      color = 'from-cyan-400 to-blue-500';
    }
    // Warm weather (60-75°F) - Recommend fruit series
    else if (tempF > 60) {
      recommendedDrink = getRandomDrink(fruitSeries);
      reason = 'Light and fruity for pleasant weather';
      icon = '🍓';
      color = 'from-pink-400 to-red-400';
    }
    // Cool weather (45-60°F) - Recommend milk series
    else if (tempF > 45) {
      recommendedDrink = getRandomDrink(milkSeries);
      reason = 'Smooth and comforting for cool days';
      icon = '🥛';
      color = 'from-amber-400 to-yellow-600';
    }
    // Cold weather (< 45°F) - Recommend coffee
    else {
      recommendedDrink = getRandomDrink(coffeeSeries);
      reason = 'Warm coffee to beat the cold';
      icon = '☕';
      color = 'from-amber-600 to-brown-600';
    }

    // Weather condition overrides
    if (isRainy || isSnowy) {
      recommendedDrink = getRandomDrink(coffeeSeries);
      reason = isSnowy ? 'Warm coffee for snowy weather' : 'Cozy coffee for rainy days';
      icon = '☕';
      color = 'from-amber-600 to-brown-600';
    }

    // Fallback to any drink if nothing found
    if (!recommendedDrink && drinks.length > 0) {
      recommendedDrink = getRandomDrink(drinks);
      reason = 'Always a great choice!';
    }

    return {
      name: recommendedDrink?.name || 'Classic Milk Tea',
      price: recommendedDrink?.price || '5.99',
      category: recommendedDrink?.category || 'Milk Series',
      reason,
      icon,
      color
    };
  };

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend proxy endpoint to keep API key secure
      const response = await fetch(API_ENDPOINTS.weather);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weather...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-bold mb-2">Weather Unavailable</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchWeather}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData || !weatherData.current) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">No weather data available</p>
      </div>
    );
  }

  const { current, location, forecast } = weatherData;
  const tempF = Math.round(current.temp_f);
  const feelsLikeF = Math.round(current.feelslike_f);

  return (
    <div className="h-full overflow-y-auto p-6 bg-linear-to-br from-blue-50 to-blue-100">
      {/* Current Weather */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Current Weather</h2>
            <p className="text-gray-600">{location.name}, {location.region}</p>
            <p className="text-sm text-gray-500">{new Date(location.localtime).toLocaleString()}</p>
          </div>
          <button
            onClick={fetchWeather}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Refresh weather"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={`https:${current.condition.icon}`}
              alt={current.condition.text}
              className="w-32 h-32"
            />
            <div>
              <div className="text-6xl font-bold text-gray-800">{tempF}°F</div>
              <div className="text-xl text-gray-600">{current.condition.text}</div>
              <div className="text-gray-500">Feels like {feelsLikeF}°F</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <WeatherDetail label="Humidity" value={`${current.humidity}%`} />
            <WeatherDetail label="Wind" value={`${Math.round(current.wind_mph)} mph ${current.wind_dir}`} />
            <WeatherDetail label="UV Index" value={Math.round(current.uv)} />
            <WeatherDetail label="Visibility" value={`${current.vis_miles} mi`} />
            <WeatherDetail label="Pressure" value={`${current.pressure_in} in`} />
            <WeatherDetail label="Precip" value={`${current.precip_in} in`} />
          </div>
        </div>
      </div>

      {/* Drink Recommendation Based on Weather */}
      {(() => {
        const recommendation = getDrinkRecommendation(current.temp_f, current.condition.text);
        return (
          <div className={`bg-gradient-to-r ${recommendation.color} rounded-2xl shadow-lg p-8 mb-6`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-4xl mr-3">{recommendation.icon}</span>
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">Recommended Drink</h3>
                </div>
                <p className="text-3xl font-bold mb-1 text-white drop-shadow-lg">{recommendation.name}</p>
                <p className="text-xl mb-2 text-white drop-shadow-md">${parseFloat(recommendation.price).toFixed(2)}</p>
                <p className="text-lg mb-1 text-white drop-shadow-md">{recommendation.reason}</p>
                <div className="mt-3 inline-block bg-black bg-opacity-30 px-4 py-2 rounded-full text-sm text-white font-semibold">
                  {recommendation.category}
                </div>
                <div className="mt-4 text-sm text-white drop-shadow-md">
                  Based on current conditions: {tempF}°F, {current.condition.text}
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-32 h-32 opacity-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm-5 10c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V5h10v8zM9 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Forecast */}
      {forecast && forecast.forecastday && forecast.forecastday.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">{forecast.forecastday.length}-Day Forecast</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {forecast.forecastday.map((day, index) => {
              const date = new Date(day.date);
              const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
              const maxTemp = Math.round(day.day.maxtemp_f);
              const minTemp = Math.round(day.day.mintemp_f);

              return (
                <div
                  key={day.date}
                  className="bg-blue-50 rounded-xl p-4 text-center hover:bg-blue-100 transition-colors"
                >
                  <div className="font-semibold text-gray-800 mb-2">{dayName}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <img
                    src={`https:${day.day.condition.icon}`}
                    alt={day.day.condition.text}
                    className="w-16 h-16 mx-auto"
                  />
                  <div className="text-sm text-gray-600 mb-2">
                    {day.day.condition.text}
                  </div>
                  <div className="flex justify-center gap-2 text-sm">
                    <span className="font-bold text-gray-800">{maxTemp}°</span>
                    <span className="text-gray-500">{minTemp}°</span>
                  </div>
                  {day.day.daily_chance_of_rain > 0 && (
                    <div className="text-xs text-blue-600 mt-2">
                      💧 {day.day.daily_chance_of_rain}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * WeatherDetail - Small component for displaying weather metrics
 */
function WeatherDetail({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-semibold text-gray-800">{value}</div>
    </div>
  );
}
