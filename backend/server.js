const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { db } = require('./config');
require('dotenv').config();

const app = express();
const port = 3001;
const pool = new Pool(db);

// Add connection error handler
pool.on('error', (err, client) => {
  console.error('Unexpected database error on idle client', err);
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection config:', {
      host: db.host,
      port: db.port,
      database: db.database,
      user: db.user
    });
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

app.use(cors());
app.use(express.json());

/**
 * GET /api/health
 * Simple health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

/**
 * GET /api/weather
 * Proxy endpoint for WeatherAPI.com
 * Keeps API key secure on the server side
 * Free tier: 1M calls/month
 */
app.get('/api/weather', async (req, res) => {
  try {
    // College Station, TX
    const location = '30.6280,-96.3344'; // lat,lon format
    
    // Get API key from environment variable
    const API_KEY = process.env.WEATHERAPI_KEY || 'YOUR_API_KEY_HERE';
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      return res.status(500).json({ 
        error: 'WeatherAPI key not configured. Please set WEATHERAPI_KEY environment variable.',
        instructions: 'Get your free API key from https://www.weatherapi.com/signup.aspx'
      });
    }
    
    // Call WeatherAPI.com Forecast API (includes current + 3 day forecast on free tier)
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=7&aqi=no&alerts=no`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`WeatherAPI error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const weatherData = await response.json();
    res.json(weatherData);
    
  } catch (err) {
    console.error('Weather API error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: err.message 
    });
  }
});

/**
 * GET /api/menu
 * Fetches all menu items and dynamically creates a category list
 * based on the user's existing database schema.
 */
app.get('/api/menu', async (req, res) => {
  try {
    // 1. Get all menu items from your table
    const menuItemsPromise = pool.query('SELECT * FROM menu_items');

    
    // 2. Get all unique categories from the 'menu_items' table.
    //    Only show categories where type = 'Drink' or category = 'Miscellaneous'
    //    Custom sort: Seasonal before Miscellaneous, then alphabetically
    const categoriesPromise = pool.query(`
      SELECT DISTINCT 
        category,
        CASE 
          WHEN category = 'Seasonal' THEN 1
          WHEN category = 'Miscellaneous' THEN 2
          ELSE 0
        END as sort_order
      FROM menu_items 
      WHERE type = 'Drink' OR category = 'Miscellaneous'
      ORDER BY sort_order, category
    `);

    // 3. Get toppings (type = 'Topping')
    const toppingsPromise = pool.query(`
      SELECT menuitemid, name, price 
      FROM menu_items 
      WHERE type = 'Topping' AND available = true
      ORDER BY name
    `);

    // 4. Get sweetness options (type = 'Modification' and category = 'sweetness')
    const sweetnessPromise = pool.query(`
      SELECT menuitemid, name, price 
      FROM menu_items 
      WHERE type = 'Modification' AND category = 'sweetness'
      ORDER BY menuitemid
    `);

    // 5. Get ice options (type = 'Modification' and category = 'ice')
    const icePromise = pool.query(`
      SELECT menuitemid, name, price 
      FROM menu_items 
      WHERE type = 'Modification' AND category = 'ice'
      ORDER BY menuitemid
    `);

    // Wait for all queries to finish
    const [menuItemsResult, categoriesResult, toppingsResult, sweetnessResult, iceResult] = await Promise.all([
      menuItemsPromise,
      categoriesPromise,
      toppingsPromise,
      sweetnessPromise,
      icePromise,
    ]);
    
    // Send the structured data
    res.json({
      // Send back the categories, e.g., [{category: 'Milky Series'}, {category: 'Fruity Beverage'}]
      categories: categoriesResult.rows,
      // Send back all the drinks
      menu_items: menuItemsResult.rows,
      // Send back customization options
      toppings: toppingsResult.rows,
      sweetness_options: sweetnessResult.rows,
      ice_options: iceResult.rows,
    });
    
  } catch (err) {
    console.error('Database error details:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({ 
      error: 'An error occurred while fetching the menu.',
      details: err.message,
      code: err.code
    });
  }
});
app.listen(port, () => {
  console.log(`Kiosk backend server running on http://localhost:${port}`);
});