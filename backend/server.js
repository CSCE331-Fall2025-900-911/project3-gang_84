const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Database config - use env vars in production, config.js for local dev
let dbConfig;
if (process.env.DATABASE_URL) {
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
} else if (process.env.DB_USER) {
  dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432')
  };
} else {
  // Fall back to config.js for local development
  try {
    const { db } = require('./database/config');
    dbConfig = db;
  } catch (err) {
    console.error('❌ No database configuration found. Set environment variables or create config.js');
    process.exit(1);
  }
}

const pool = new Pool(dbConfig);

// Add connection error handler
pool.on('error', (err, client) => {
  console.error('Unexpected database error on idle client', err);
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection config:', dbConfig.connectionString ? 'Using DATABASE_URL' : {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5175',
    'https://csce331-fall2025-900-911.github.io'
  ],
  credentials: true
}));
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
    const location = '30.6280,-96.3344';
    
    // Get API key from environment variable
    const API_KEY = process.env.WEATHERAPI_KEY || 'YOUR_API_KEY_HERE';
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
      // Return mock weather data when API key is not configured
      console.warn('⚠️ WEATHERAPI_KEY not configured. Using mock weather data.');
      console.warn('Get your free API key from https://www.weatherapi.com/signup.aspx');
      
      return res.json({
        location: {
          name: 'College Station',
          region: 'Texas',
          country: 'United States of America',
          lat: 30.63,
          lon: -96.33,
          localtime: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
        },
        current: {
          temp_f: 72,
          temp_c: 22,
          condition: {
            text: 'Partly cloudy',
            icon: '//cdn.weatherapi.com/weather/64x64/day/116.png'
          },
          wind_mph: 8,
          wind_kph: 12.9,
          humidity: 65,
          feelslike_f: 72,
          feelslike_c: 22
        },
        forecast: {
          forecastday: [
            {
              date: new Date().toISOString().split('T')[0],
              day: {
                maxtemp_f: 78,
                maxtemp_c: 26,
                mintemp_f: 65,
                mintemp_c: 18,
                condition: {
                  text: 'Partly cloudy',
                  icon: '//cdn.weatherapi.com/weather/64x64/day/116.png'
                }
              }
            },
            {
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              day: {
                maxtemp_f: 80,
                maxtemp_c: 27,
                mintemp_f: 67,
                mintemp_c: 19,
                condition: {
                  text: 'Sunny',
                  icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
                }
              }
            },
            {
              date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
              day: {
                maxtemp_f: 82,
                maxtemp_c: 28,
                mintemp_f: 68,
                mintemp_c: 20,
                condition: {
                  text: 'Sunny',
                  icon: '//cdn.weatherapi.com/weather/64x64/day/113.png'
                }
              }
            }
          ]
        }
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
      categories: categoriesResult.rows,
      menu_items: menuItemsResult.rows,
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

/**
 * POST /api/translate
 * Translates text to the target language using MyMemory Translation API
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Use MyMemory Translation API (free, no API key required)
    const https = require('https');
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    
    https.get(url, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.responseData && result.responseData.translatedText) {
            res.json({ translatedText: result.responseData.translatedText });
          } else {
            res.status(500).json({ error: 'Translation failed' });
          }
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse translation response' });
        }
      });
    }).on('error', (err) => {
      console.error('Translation API error:', err);
      res.status(500).json({ error: 'Translation service unavailable' });
    });
    
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'An error occurred during translation' });
  }
});

/**
 * POST /api/customer/login
 * Customer login with phone number and PIN
 */
app.post('/api/customer/login', async (req, res) => {
  try {
    const { phoneNumber, pin } = req.body;

    if (!phoneNumber || !pin) {
      return res.status(400).json({ error: 'Phone number and PIN are required' });
    }

    // Query database for customer
    const result = await pool.query(
      'SELECT customerid, name, phonenumber, loyaltypoints FROM customers WHERE phonenumber = $1 AND pin = $2',
      [phoneNumber, pin]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    const customer = result.rows[0];
    res.json({ 
      success: true,
      customer: {
        customerId: customer.customerid,
        name: customer.name,
        phoneNumber: customer.phonenumber,
        loyaltyPoints: customer.loyaltypoints
      }
    });

  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

/**
 * POST /api/customer/signup
 * Create a new customer account
 */
app.post('/api/customer/signup', async (req, res) => {
  try {
    const { name, phoneNumber, pin } = req.body;

    // Validation
    if (!name || !phoneNumber || !pin) {
      return res.status(400).json({ error: 'Name, phone number, and PIN are required' });
    }

    if (phoneNumber.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    // Check if phone number already exists
    const existingCustomer = await pool.query(
      'SELECT customerid FROM customers WHERE phonenumber = $1',
      [phoneNumber]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this phone number already exists' });
    }

    // Insert new customer (loyaltypoints defaults to 0)
    const result = await pool.query(
      'INSERT INTO customers (name, phonenumber, pin, loyaltypoints) VALUES ($1, $2, $3, 0) RETURNING customerid, name, phonenumber, loyaltypoints',
      [name, phoneNumber, pin]
    );

    const newCustomer = result.rows[0];
    res.status(201).json({ 
      success: true,
      customer: {
        customerId: newCustomer.customerid,
        name: newCustomer.name,
        phoneNumber: newCustomer.phonenumber,
        loyaltyPoints: newCustomer.loyaltypoints
      }
    });

  } catch (err) {
    console.error('Customer signup error:', err);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});

/**
 * POST /api/orders
 * Create a new order with order items and payment
 */
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      cartItems, 
      totalCost, 
      customerId, 
      employeeId, 
      paymentType,
      rewardsUsed = [],
      rewardDiscount = 0,
      pointsRedeemed = 0
    } = req.body;

    // Validation
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!totalCost || totalCost < 0) {
      return res.status(400).json({ error: 'Invalid total cost' });
    }

    if (!paymentType) {
      return res.status(400).json({ error: 'Payment type is required' });
    }

    // If rewards are used, verify customer has enough points
    if (pointsRedeemed > 0 && customerId) {
      const customerCheck = await client.query(
        'SELECT loyaltypoints FROM customers WHERE customerid = $1',
        [customerId]
      );
      
      if (customerCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Customer not found' });
      }
      
      if (customerCheck.rows[0].loyaltypoints < pointsRedeemed) {
        return res.status(400).json({ error: 'Insufficient loyalty points' });
      }
    }

    // Start transaction
    await client.query('BEGIN');

    // Get current date and time
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    // Insert into orders table
    const orderResult = await client.query(
      `INSERT INTO orders (date, time, totalcost, employeeid, customerid) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING orderid`,
      [currentDate, currentTime, totalCost, employeeId || null, customerId || null]
    );

    const orderId = orderResult.rows[0].orderid;

    // Mapping toppings to ingredients
    const toppingToIngredient = {
      'Pearls (tapioca balls)': 'Tapioca pearls (raw)',
      'Crystal Boba': 'Crystal boba (raw)',
      'Lychee Jelly': 'Lychee jelly cubes',
      'Strawberry Popping Boba': 'Strawberry popping boba',
      'Mango Popping Boba': 'Mango popping boba',
      'Pudding': 'Pudding mix',
      'Creama': 'Cream foam powder',
      'Coconut Jelly': 'Coconut milk',
      'Banana Milk': 'Banana Milk'
    };

    // Insert order items and deduct stock
    for (const item of cartItems) {
      // Format customizations
      const modifications = item.customizations 
        ? `Sweetness: ${item.customizations.sweetness}, Ice: ${item.customizations.ice}`
        : '';
      
      const toppings = item.customizations && item.customizations.toppings.length > 0
        ? item.customizations.toppings.join(', ')
        : '';

      // Insert each item (respecting quantity)
      for (let i = 0; i < item.quantity; i++) {
        await client.query(
          `INSERT INTO order_items (orderid, drink, modifications, toppings, price) 
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.name, modifications, toppings, item.price]
        );

        // Deduct ingredients for the drink from recipes table
        const recipeResult = await client.query(
          `SELECT ingredientid, quantity FROM recipes WHERE menuitemname = $1`,
          [item.name]
        );

        for (const recipe of recipeResult.rows) {
          await client.query(
            `UPDATE ingredients 
             SET stock = stock - $1 
             WHERE ingredientid = $2`,
            [recipe.quantity, recipe.ingredientid]
          );
        }

        // Deduct ingredients for toppings
        if (item.customizations && item.customizations.toppings.length > 0) {
          for (const topping of item.customizations.toppings) {
            const ingredientName = toppingToIngredient[topping];
            if (ingredientName) {
              // Assume 1 unit per topping serving
              await client.query(
                `UPDATE ingredients 
                 SET stock = stock - 1 
                 WHERE ingredientname = $1`,
                [ingredientName]
              );
            }
          }
        }

        // Deduct ice (standard amount per drink)
        await client.query(
          `UPDATE ingredients 
           SET stock = stock - 1 
           WHERE ingredientname = 'Ice'`
        );

        // Deduct cups, lids, straws, napkins (1 of each per drink)
        const supplies = ['Plastic cups (16oz)', 'Cup lids', 'Straws', 'Napkins'];
        for (const supply of supplies) {
          await client.query(
            `UPDATE ingredients 
             SET stock = stock - 1 
             WHERE ingredientname = $1`,
            [supply]
          );
        }
      }
    }

    // Insert payment record
    await client.query(
      `INSERT INTO payments (order_id, payment_type, amount, payment_status) 
       VALUES ($1, $2, $3, $4)`,
      [orderId, paymentType, totalCost, 'Completed']
    );

    // Update customer loyalty points if customer is logged in
    if (customerId) {
      // Add 1 point per dollar spent (rounded down) on FINAL total (after discounts)
      const pointsToAdd = Math.floor(totalCost);
      
      // Deduct redeemed points and add earned points in one query
      await client.query(
        `UPDATE customers 
         SET loyaltypoints = loyaltypoints + $1 - $2 
         WHERE customerid = $3`,
        [pointsToAdd, pointsRedeemed, customerId]
      );
      
      console.log(`Customer ${customerId}: Earned ${pointsToAdd} points, Spent ${pointsRedeemed} points`);
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({ 
      success: true,
      orderId: orderId,
      message: 'Order created successfully'
    });

  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Order creation error:', err);
    res.status(500).json({ 
      error: 'An error occurred while creating the order',
      details: err.message 
    });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Kiosk backend server running on http://localhost:${port}`);
});