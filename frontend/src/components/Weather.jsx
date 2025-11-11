import React, { useState, useEffect } from 'react';

/**
 * Weather Component
 * Displays current weather and forecast using WeatherAPI.com
 */
export default function Weather() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend proxy endpoint to keep API key secure
      const response = await fetch('http://localhost:3001/api/weather');
      
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
