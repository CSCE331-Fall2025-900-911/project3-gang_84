const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

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

    // 6. Get size options (type = 'Modification' and category = 'size')
    const sizePromise = pool.query(`
      SELECT menuitemid, name, price 
      FROM menu_items 
      WHERE type = 'Modification' AND category = 'size'
      ORDER BY menuitemid
    `);

    // Wait for all queries to finish
    const [menuItemsResult, categoriesResult, toppingsResult, sweetnessResult, iceResult, sizeResult] = await Promise.all([
      menuItemsPromise,
      categoriesPromise,
      toppingsPromise,
      sweetnessPromise,
      icePromise,
      sizePromise,
    ]);
    
    // Send the structured data
    res.json({
      categories: categoriesResult.rows,
      menu_items: menuItemsResult.rows,
      toppings: toppingsResult.rows,
      sweetness_options: sweetnessResult.rows,
      ice_options: iceResult.rows,
      size_options: sizeResult.rows,
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
 * GET /api/translations/:lang
 * Fetch all cached translations for a language from database
 * Returns instantly for fast language switching
 */
app.get('/api/translations/:lang', async (req, res) => {
  try {
    const { lang } = req.params;
    
    const result = await pool.query(
      'SELECT text_key, translated_text FROM translations WHERE language_code = $1',
      [lang]
    );
    
    // Convert to key-value object for easy lookup
    const translations = {};
    result.rows.forEach(row => {
      translations[row.text_key] = row.translated_text;
    });
    
    res.json({ translations, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching translations:', err);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

/**
 * POST /api/translations/populate
 * One-time population of translations using MyMemory API
 * Call this to translate and cache all menu items and UI labels
 */
app.post('/api/translations/populate', async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    
    if (!texts || !Array.isArray(texts) || !targetLang) {
      return res.status(400).json({ error: 'texts array and targetLang required' });
    }

    console.log(`🔄 Populating ${texts.length} translations for ${targetLang}...`);
    
    const https = require('https');
    const translatedCount = { new: 0, existing: 0 };

    for (const text of texts) {
      try {
        // Check if translation already exists
        const existing = await pool.query(
          'SELECT translated_text, manual_override FROM translations WHERE text_key = $1 AND language_code = $2',
          [text, targetLang]
        );

        if (existing.rows.length > 0) {
          // Skip if it's a manual override - never re-translate these
          if (existing.rows[0].manual_override) {
            console.log(`⏭️  Skipped (manual override): "${text}"`);
            translatedCount.existing++;
            continue;
          }
          // Skip if translation already exists (but allow re-translation if needed in future)
          translatedCount.existing++;
          continue;
        }

        // Translate using MyMemory API
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
        
        const translation = await new Promise((resolve, reject) => {
          https.get(url, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => { data += chunk; });
            apiRes.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                if (parsed.responseData && parsed.responseData.translatedText) {
                  resolve(parsed.responseData.translatedText);
                } else {
                  resolve(text); // Fallback to original
                }
              } catch (e) {
                resolve(text);
              }
            });
          }).on('error', () => resolve(text));
        });

        // Store in database with manual_override = FALSE (auto-translated)
        await pool.query(
          'INSERT INTO translations (text_key, language_code, translated_text, manual_override) VALUES ($1, $2, $3, FALSE) ON CONFLICT (text_key, language_code) DO NOTHING',
          [text, targetLang, translation]
        );

        translatedCount.new++;
        console.log(`✓ Stored: "${text}" → "${translation}"`);

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Error translating "${text}":`, err);
      }
    }

    console.log(`✅ Population complete: ${translatedCount.new} new, ${translatedCount.existing} existing`);
    res.json({ 
      success: true, 
      newTranslations: translatedCount.new,
      existingTranslations: translatedCount.existing 
    });
  } catch (err) {
    console.error('Translation population error:', err);
    res.status(500).json({ error: 'Failed to populate translations' });
  }
});

/**
 * POST /api/translate
 * Translates text to the target language using MyMemory Translation API
 * Supports both single text and batch translation
 * MyMemory has higher rate limits than LibreTranslate for free tier
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, texts, targetLang } = req.body;
    
    if ((!text && !texts) || !targetLang) {
      return res.status(400).json({ error: 'Text/texts and target language are required' });
    }

    const https = require('https');
    
    // Batch translation support - translate one at a time with MyMemory
    if (texts && Array.isArray(texts)) {
      const translatedTexts = [];
      
      for (const item of texts) {
        try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(item)}&langpair=en|${targetLang}`;
          
          const result = await new Promise((resolve, reject) => {
            https.get(url, (apiRes) => {
              let data = '';
              apiRes.on('data', (chunk) => { data += chunk; });
              apiRes.on('end', () => {
                try {
                  const parsed = JSON.parse(data);
                  console.log(`🔍 MyMemory API response for "${item}":`, JSON.stringify(parsed));
                  if (parsed.responseData && parsed.responseData.translatedText) {
                    const translated = parsed.responseData.translatedText;
                    console.log(`✅ Translated: "${item}" → "${translated}"`);
                    resolve(translated);
                  } else {
                    console.log(`❌ No translation found for "${item}", using original`);
                    resolve(item); // Return original on error
                  }
                } catch (e) {
                  console.error(`❌ Parse error for "${item}":`, e);
                  resolve(item);
                }
              });
            }).on('error', (err) => {
              console.error(`❌ Network error for "${item}":`, err);
              resolve(item);
            });
          });
          
          translatedTexts.push(result);
          
          // Small delay to avoid rate limiting (100ms between requests)
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`❌ Exception translating "${item}":`, err);
          translatedTexts.push(item); // Return original on error
        }
      }

      console.log(`🎉 Batch translation complete! Sending ${translatedTexts.length} translations back to client`);
      console.log(`📦 Sample results:`, translatedTexts.slice(0, 5));
      return res.json({ translatedTexts });
    }

    // Single text translation using MyMemory
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
            console.error('MyMemory error:', result);
            res.json({ translatedText: text }); // Return original text on error
          }
        } catch (e) {
          console.error('Failed to parse translation response:', e);
          res.json({ translatedText: text }); // Return original text on parse error
        }
      });
    }).on('error', (err) => {
      console.error('Translation API error:', err);
      res.json({ translatedText: text }); // Return original text on network error
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
      'SELECT customerid, name, phonenumber, loyaltypoints, pin FROM customers WHERE phonenumber = $1',
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0];
    
    console.log('🔐 Login attempt:');
    console.log('  Phone:', phoneNumber);
    console.log('  Provided PIN:', pin, 'Type:', typeof pin);
    console.log('  Stored PIN:', customer.pin, 'Type:', typeof customer.pin);
    
    // Check if customer has no PIN (created by cashier)
    if (!customer.pin) {
      return res.status(403).json({ 
        error: 'PIN required',
        needsPinSetup: true,
        message: 'Please set up a PIN for your account'
      });
    }

    // Verify PIN (convert both to strings for comparison)
    if (String(customer.pin) !== String(pin)) {
      console.log('  ❌ PIN mismatch');
      return res.status(401).json({ error: 'Incorrect PIN' });
    }

    console.log('  ✅ PIN match - login successful');

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
 * GET /api/customer/check/:phoneNumber
 * Check if customer exists and whether PIN is set (no authentication required)
 */
app.get('/api/customer/check/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    // Query customer by phone number
    const result = await pool.query(
      'SELECT customerid, name, pin FROM customers WHERE phonenumber = $1',
      [cleanPhone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found', exists: false });
    }

    const customer = result.rows[0];
    
    res.json({ 
      exists: true,
      hasPin: customer.pin !== null && customer.pin !== undefined,
      name: customer.name
    });

  } catch (err) {
    console.error('Customer check error:', err);
    res.status(500).json({ error: 'An error occurred while checking customer' });
  }
});

/**
 * POST /api/customer/set-pin
 * Set or update PIN for a customer account
 */
app.post('/api/customer/set-pin', async (req, res) => {
  try {
    const { phoneNumber, pin } = req.body;

    if (!phoneNumber || !pin) {
      return res.status(400).json({ error: 'Phone number and PIN are required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    // Update customer PIN
    const result = await pool.query(
      'UPDATE customers SET pin = $1 WHERE phonenumber = $2 RETURNING customerid, name, phonenumber, loyaltypoints',
      [pin, phoneNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
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
    console.error('Set PIN error:', err);
    res.status(500).json({ error: 'An error occurred while setting PIN' });
  }
});

/**
 * POST /api/customer/signup
 * Create a new customer account
 * PIN is optional - cashiers can create accounts without PIN
 */
app.post('/api/customer/signup', async (req, res) => {
  try {
    const { name, phoneNumber, pin } = req.body;

    // Validation
    if (!name || !phoneNumber) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    if (phoneNumber.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    // PIN is optional, but if provided, must be 4 digits
    if (pin !== null && pin !== undefined && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
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

    // Insert new customer (loyaltypoints defaults to 0, pin can be NULL)
    const result = await pool.query(
      'INSERT INTO customers (name, phonenumber, pin, loyaltypoints) VALUES ($1, $2, $3, 0) RETURNING customerid, name, phonenumber, loyaltypoints',
      [name, phoneNumber, pin || null]
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
 * GET /api/customers/phone/:phoneNumber
 * Look up customer by phone number (no PIN required for cashier lookup)
 */
app.get('/api/customers/phone/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    console.log('🔍 Customer lookup request:');
    console.log('  Original phone:', phoneNumber);

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Remove all non-digit characters to handle formatted phone numbers
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    console.log('  Clean phone:', cleanPhone);

    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    // Query customer by phone number (database stores without formatting)
    console.log('  Querying database for phone:', cleanPhone);
    const result = await pool.query(
      'SELECT customerid, name, phonenumber, loyaltypoints FROM customers WHERE phonenumber = $1',
      [cleanPhone]
    );

    console.log('  Query result rows:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('  Found customer:', result.rows[0]);
    }

    if (result.rows.length === 0) {
      // Let's also try a LIKE query to see what's in the database
      console.log('  Trying LIKE query for debugging...');
      const likeResult = await pool.query(
        'SELECT customerid, name, phonenumber, loyaltypoints FROM customers WHERE phonenumber LIKE $1 LIMIT 5',
        [`%${cleanPhone.slice(-4)}%`]
      );
      console.log('  Similar phone numbers found:', likeResult.rows);
      
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = result.rows[0];
    res.json({
      customerid: customer.customerid,
      name: customer.name,
      phonenumber: customer.phonenumber,
      loyaltypoints: customer.loyaltypoints
    });

  } catch (err) {
    console.error('❌ Customer lookup error:', err);
    res.status(500).json({ error: 'An error occurred during customer lookup' });
  }
});

/**
 * POST /api/orders
 * Create a new order with order items and payment
 */
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('📝 Order submission received:');
    console.log('  Body:', JSON.stringify(req.body, null, 2));

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
      console.log('  ❌ Validation failed: Cart is empty');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!totalCost || totalCost < 0) {
      console.log('  ❌ Validation failed: Invalid total cost');
      return res.status(400).json({ error: 'Invalid total cost' });
    }

    if (!paymentType) {
      console.log('  ❌ Validation failed: Payment type is required');
      return res.status(400).json({ error: 'Payment type is required' });
    }

    console.log('  ✅ Validation passed');

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
    console.log('  🔄 Transaction started');

    // Get current date and time
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    console.log(`  Creating order: date=${currentDate}, time=${currentTime}, total=${totalCost}, employee=${employeeId}, customer=${customerId}`);

    // Insert into orders table
    const orderResult = await client.query(
      `INSERT INTO orders (date, time, totalcost, employeeid, customerid) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING orderid`,
      [currentDate, currentTime, totalCost, employeeId || null, customerId || null]
    );

    const orderId = orderResult.rows[0].orderid;
    console.log(`  ✅ Order created with ID: ${orderId}`);

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
      console.log('  Processing item:', item);
      
      // Get item name - if not provided, look it up from the database using menuitemid
      let itemName = item.name || item.itemname || item.drink;
      
      if (!itemName && item.menuitemid) {
        console.log(`  Looking up item name for menuitemid: ${item.menuitemid}`);
        const menuItemResult = await client.query(
          'SELECT name FROM menu_items WHERE menuitemid = $1',
          [item.menuitemid]
        );
        
        if (menuItemResult.rows.length > 0) {
          itemName = menuItemResult.rows[0].name;
          console.log(`  Found item name: ${itemName}`);
        }
      }
      
      if (!itemName) {
        throw new Error(`Item name is missing from cart item and could not be found for menuitemid: ${item.menuitemid}`);
      }

      // Format customizations
      const modifications = item.customizations 
        ? `Sweetness: ${item.customizations.sweetness}, Ice: ${item.customizations.ice}`
        : '';
      
      const toppings = item.customizations && item.customizations.toppings && item.customizations.toppings.length > 0
        ? item.customizations.toppings.join(', ')
        : '';

      // Insert each item (respecting quantity)
      for (let i = 0; i < item.quantity; i++) {
        await client.query(
          `INSERT INTO order_items (orderid, drink, modifications, toppings, price) 
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, itemName, modifications, toppings, item.price]
        );

        // Deduct ingredients for the drink from recipes table
        const recipeResult = await client.query(
          `SELECT ingredientid, quantity FROM recipes WHERE menuitemname = $1`,
          [itemName]
        );

        console.log(`  Found ${recipeResult.rows.length} recipe ingredients for ${itemName}`);

        // Track low inventory items
        const lowInventoryItems = [];

        for (const recipe of recipeResult.rows) {
          const updateResult = await client.query(
            `UPDATE ingredients 
             SET stock = stock - $1 
             WHERE ingredientid = $2
             RETURNING ingredientname, stock`,
            [recipe.quantity, recipe.ingredientid]
          );
          
          if (updateResult.rows.length > 0) {
            const { ingredientname, stock } = updateResult.rows[0];
            console.log(`  📦 Deducted ${recipe.quantity} ${ingredientname} (remaining: ${stock})`);
            
            // Check if inventory is low (below 20 units)
            if (stock < 20) {
              lowInventoryItems.push({ name: ingredientname, stock });
            }
          }
        }

        // Deduct ingredients for toppings
        if (item.customizations && item.customizations.toppings && item.customizations.toppings.length > 0) {
          for (const topping of item.customizations.toppings) {
            const ingredientName = toppingToIngredient[topping];
            if (ingredientName) {
              // Assume 1 unit per topping serving
              const toppingResult = await client.query(
                `UPDATE ingredients 
                 SET stock = stock - 1 
                 WHERE ingredientname = $1
                 RETURNING ingredientname, stock`,
                [ingredientName]
              );
              
              if (toppingResult.rows.length > 0) {
                const { ingredientname, stock } = toppingResult.rows[0];
                console.log(`  🧋 Deducted 1 ${ingredientname} (remaining: ${stock})`);
                
                if (stock < 20) {
                  lowInventoryItems.push({ name: ingredientname, stock });
                }
              }
            }
          }
        }

        // Deduct ice (standard amount per drink)
        const iceResult = await client.query(
          `UPDATE ingredients 
           SET stock = stock - 1 
           WHERE ingredientname = 'Ice'
           RETURNING ingredientname, stock`
        );
        
        if (iceResult.rows.length > 0) {
          const { ingredientname, stock } = iceResult.rows[0];
          console.log(`  🧊 Deducted 1 ${ingredientname} (remaining: ${stock})`);
          
          if (stock < 20) {
            lowInventoryItems.push({ name: ingredientname, stock });
          }
        }

        // Deduct cups, straws, napkins (1 of each per drink)
        // Note: Using actual ingredient names from database
        const supplies = ['Cups', 'Straws', 'Napkins'];
        for (const supply of supplies) {
          const supplyResult = await client.query(
            `UPDATE ingredients 
             SET stock = stock - 1 
             WHERE ingredientname = $1
             RETURNING ingredientname, stock`,
            [supply]
          );
          
          if (supplyResult.rows.length > 0) {
            const { ingredientname, stock } = supplyResult.rows[0];
            console.log(`  🥤 Deducted 1 ${ingredientname} (remaining: ${stock})`);
            
            if (stock < 20) {
              lowInventoryItems.push({ name: ingredientname, stock });
            }
          }
        }

        // Log low inventory warnings
        if (lowInventoryItems.length > 0) {
          console.log('  ⚠️  LOW INVENTORY WARNING:');
          lowInventoryItems.forEach(item => {
            console.log(`     - ${item.name}: ${item.stock} units remaining`);
          });
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

    console.log(`  ✅ Order ${orderId} created successfully`);

    const responseData = { 
      success: true,
      orderId: orderId,  // Use camelCase to match kiosk expectation
      orderid: orderId,  // Keep lowercase for backward compatibility
      message: 'Order created successfully'
    };

    console.log('  📤 Sending response:', JSON.stringify(responseData));

    res.status(201).json(responseData);

  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Order creation error:', err);
    console.error('  Stack:', err.stack);
    res.status(500).json({ 
      error: 'An error occurred while creating the order',
      details: err.message 
    });
  } finally {
    client.release();
  }
});

/**
 * MANAGER API ENDPOINTS
 */

// GET /api/manager/inventory - Get all inventory items
app.get('/api/manager/inventory', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ingredientid,
        ingredientname,
        stock as quantity,
        unit,
        20 as reorder_level
      FROM ingredients
      ORDER BY ingredientname
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/manager/inventory - Add new inventory item
app.post('/api/manager/inventory', async (req, res) => {
  try {
    const { ingredientname, quantity, unit } = req.body;
    const result = await pool.query(
      `INSERT INTO ingredients (ingredientname, stock, unit)
       VALUES ($1, $2, $3)
       RETURNING ingredientid, ingredientname, stock as quantity, unit`,
      [ingredientname, quantity, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding inventory item:', err);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// PUT /api/manager/inventory/:id - Update inventory item
app.put('/api/manager/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredientname, quantity, unit } = req.body;
    const result = await pool.query(
      `UPDATE ingredients 
       SET ingredientname = $1, stock = $2, unit = $3
       WHERE ingredientid = $4
       RETURNING ingredientid, ingredientname, stock as quantity, unit`,
      [ingredientname, quantity, unit, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// DELETE /api/manager/inventory/:id - Delete inventory item
app.delete('/api/manager/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete any recipes that reference this ingredient
    await pool.query(
      'DELETE FROM recipes WHERE ingredientid = $1',
      [id]
    );
    
    // Then delete the ingredient itself
    const result = await pool.query(
      'DELETE FROM ingredients WHERE ingredientid = $1 RETURNING ingredientid, ingredientname',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Inventory item and associated recipes deleted',
      deletedItem: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// PUT /api/manager/menu/:id - Update menu item
app.put('/api/manager/menu/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, type, price, category, available, recipe } = req.body;
    
    // Get the old name and type first
    const oldResult = await client.query(
      'SELECT name, type FROM menu_items WHERE menuitemid = $1',
      [id]
    );
    const oldName = oldResult.rows[0]?.name;
    const oldType = oldResult.rows[0]?.type;
    
    // Update menu item
    const menuResult = await client.query(
      `UPDATE menu_items 
       SET name = $1, type = $2, price = $3, category = $4, available = $5
       WHERE menuitemid = $6
       RETURNING *`,
      [name, type, price, category, available, id]
    );
    
    if (menuResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    // If it's a topping, update or create in ingredients table
    if (type === 'Topping') {
      // Check if ingredient exists with old name
      const ingredientCheck = await client.query(
        'SELECT ingredientid FROM ingredients WHERE ingredientname = $1',
        [oldName]
      );
      
      if (ingredientCheck.rows.length > 0) {
        // Update existing ingredient name
        await client.query(
          'UPDATE ingredients SET ingredientname = $1 WHERE ingredientname = $2',
          [name, oldName]
        );
      } else {
        // Create new ingredient
        await client.query(
          'INSERT INTO ingredients (ingredientname, stock, unit) VALUES ($1, $2, $3)',
          [name, 0, 'pieces']
        );
      }
    }
    
    // Delete old recipe entries (using old name in case name changed)
    await client.query(
      'DELETE FROM recipes WHERE menuitemname = $1',
      [oldName]
    );
    
    // Insert new recipe entries
    if (recipe && recipe.length > 0) {
      for (const ingredient of recipe) {
        if (ingredient.ingredientid && ingredient.quantity) {
          await client.query(
            `INSERT INTO recipes (menuitemname, ingredientid, quantity)
             VALUES ($1, $2, $3)`,
            [name, parseInt(ingredient.ingredientid), parseInt(ingredient.quantity)]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json(menuResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  } finally {
    client.release();
  }
});

// GET /api/manager/menu/:id/recipe - Get recipe for a menu item
app.get('/api/manager/menu/:id/recipe', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get menu item name first
    const menuResult = await pool.query(
      'SELECT name FROM menu_items WHERE menuitemid = $1',
      [id]
    );
    
    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    const menuItemName = menuResult.rows[0].name;
    
    // Get recipe entries
    const recipeResult = await pool.query(
      'SELECT ingredientid, quantity FROM recipes WHERE menuitemname = $1',
      [menuItemName]
    );
    
    res.json(recipeResult.rows);
  } catch (err) {
    console.error('Error fetching recipe:', err);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// POST /api/manager/menu - Add new menu item
app.post('/api/manager/menu', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, type, price, category, available, recipe } = req.body;
    
    // Insert menu item
    const menuResult = await client.query(
      `INSERT INTO menu_items (name, type, price, category, available)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, type || 'Drink', price, category || '', available !== false]
    );
    
    const menuItem = menuResult.rows[0];
    
    // If it's a topping, also add it to ingredients table with quantity 0
    if (type === 'Topping') {
      await client.query(
        `INSERT INTO ingredients (ingredientname, stock, unit)
         VALUES ($1, $2, $3)`,
        [name, 0, 'pieces']
      );
    }
    
    // Insert recipe entries if provided
    if (recipe && recipe.length > 0) {
      for (const ingredient of recipe) {
        if (ingredient.ingredientid && ingredient.quantity) {
          await client.query(
            `INSERT INTO recipes (menuitemname, ingredientid, quantity)
             VALUES ($1, $2, $3)`,
            [name, parseInt(ingredient.ingredientid), parseInt(ingredient.quantity)]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json(menuItem);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  } finally {
    client.release();
  }
});

// DELETE /api/manager/menu/:id - Delete menu item
app.delete('/api/manager/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM menu_items WHERE menuitemid = $1 RETURNING menuitemid',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// GET /api/manager/employees - Get all employees
app.get('/api/manager/employees', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        employeeid,
        name,
        role,
        phonenumber
      FROM employees
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/manager/employees - Add new employee
app.post('/api/manager/employees', async (req, res) => {
  try {
    const { name, role, phonenumber } = req.body;
    const result = await pool.query(
      `INSERT INTO employees (name, role, phonenumber, login)
       VALUES ($1, $2, $3, 0)
       RETURNING *`,
      [name, role || 'Cashier', phonenumber]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// PUT /api/manager/employees/:id - Update employee
app.put('/api/manager/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phonenumber } = req.body;
    const result = await pool.query(
      `UPDATE employees 
       SET name = $1, role = $2, phonenumber = $3
       WHERE employeeid = $4
       RETURNING *`,
      [name, role, phonenumber, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/manager/employees/:id - Delete employee
app.delete('/api/manager/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM employees WHERE employeeid = $1 RETURNING employeeid',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// GET /api/manager/reports/sales - Get sales data for date range
app.get('/api/manager/reports/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get daily breakdown
    const result = await pool.query(`
      SELECT 
        o.date,
        COUNT(DISTINCT o.orderid) as orders,
        SUM(o.totalcost) as revenue,
        AVG(o.totalcost) as avg_order_value
      FROM orders o
      WHERE o.date >= $1 AND o.date <= $2
      GROUP BY o.date
      ORDER BY o.date
    `, [startDate, endDate]);
    
    // Get summary totals
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.orderid) as total_orders,
        COALESCE(SUM(o.totalcost), 0) as total_revenue,
        COALESCE(AVG(o.totalcost), 0) as avg_order_value,
        COUNT(DISTINCT o.customerid) as total_customers
      FROM orders o
      WHERE o.date >= $1 AND o.date <= $2
    `, [startDate, endDate]);
    
    const summary = summaryResult.rows[0];
    
    res.json({ 
      data: result.rows, 
      summary: { 
        totalRevenue: parseFloat(summary.total_revenue || 0), 
        totalOrders: parseInt(summary.total_orders || 0), 
        avgOrderValue: parseFloat(summary.avg_order_value || 0), 
        totalCustomers: parseInt(summary.total_customers || 0) 
      } 
    });
  } catch (err) {
    console.error('Error fetching sales data:', err);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

// GET /api/manager/reports/hourly - Get hourly order distribution
app.get('/api/manager/reports/hourly', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM time) as hour,
        COUNT(*) as orders,
        SUM(totalcost) as revenue
      FROM orders
      WHERE date >= $1 AND date <= $2
      GROUP BY EXTRACT(HOUR FROM time)
      ORDER BY hour
    `, [startDate, endDate]);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching hourly data:', err);
    res.status(500).json({ error: 'Failed to fetch hourly data' });
  }
});

// GET /api/manager/reports/product-usage - Get ingredient consumption report (Product Usage Report from Java Project 2)
app.get('/api/manager/reports/product-usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(`
      SELECT 
        i.ingredientname,
        SUM(r.quantity) AS total_used,
        i.unit
      FROM orders o
      JOIN order_items oi ON o.orderid = oi.orderid
      JOIN recipes r ON oi.drink = r.menuitemname
      JOIN ingredients i ON r.ingredientid = i.ingredientid
      WHERE o.date BETWEEN $1 AND $2
      GROUP BY i.ingredientname, i.unit
      ORDER BY i.ingredientname
    `, [startDate, endDate]);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching product usage report:', err);
    res.status(500).json({ error: 'Failed to fetch product usage report' });
  }
});

// GET /api/manager/reports/categories - Get sales by category
app.get('/api/manager/reports/categories', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(`
      SELECT 
        m.category,
        COUNT(oi.itemid) as orders,
        SUM(oi.price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.drink = m.name
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date >= $1 AND o.date <= $2
      GROUP BY m.category
      ORDER BY revenue DESC
    `, [startDate, endDate]);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching category data:', err);
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
});

// GET /api/manager/reports/popular-items - Get popular items
app.get('/api/manager/reports/popular-items', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(`
      SELECT 
        m.name,
        m.category,
        COUNT(oi.itemid) as orders,
        SUM(oi.price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.drink = m.name
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date >= $1 AND o.date <= $2
      GROUP BY m.name, m.category
      ORDER BY orders DESC
      LIMIT 10
    `, [startDate, endDate]);
    res.json({ items: result.rows });
  } catch (err) {
    console.error('Error fetching popular items:', err);
    res.status(500).json({ error: 'Failed to fetch popular items' });
  }
});

// GET /api/manager/reports/product - Get product performance report
app.get('/api/manager/reports/product', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(`
      SELECT 
        m.name,
        m.category,
        COUNT(oi.itemid) as orders,
        SUM(oi.price) as revenue,
        AVG(oi.price) as avg_price
      FROM order_items oi
      JOIN menu_items m ON oi.drink = m.name
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date >= $1 AND o.date <= $2
      GROUP BY m.name, m.category
      ORDER BY revenue DESC
    `, [startDate, endDate]);
    res.json({ items: result.rows });
  } catch (err) {
    console.error('Error fetching product report:', err);
    res.status(500).json({ error: 'Failed to fetch product report' });
  }
});

// GET /api/manager/reports/employee - Get employee performance report
app.get('/api/manager/reports/employee', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(`
      SELECT 
        e.name,
        e.role,
        COUNT(o.orderid) as orders,
        SUM(o.totalcost) as revenue,
        AVG(o.totalcost) as avg_order_value
      FROM employees e
      LEFT JOIN orders o ON e.employeeid = o.employeeid 
        AND o.date >= $1 AND o.date <= $2
      GROUP BY e.employeeid, e.name, e.role
      ORDER BY revenue DESC
    `, [startDate, endDate]);
    res.json({ employees: result.rows });
  } catch (err) {
    console.error('Error fetching employee report:', err);
    res.status(500).json({ error: 'Failed to fetch employee report' });
  }
});

// GET /api/manager/reports/inventory - Get inventory status report
app.get('/api/manager/reports/inventory', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ingredientname,
        stock,
        unit,
        20 as reorder_level,
        CASE 
          WHEN stock <= 20 THEN 'Low'
          WHEN stock <= 50 THEN 'Medium'
          ELSE 'Good'
        END as status
      FROM ingredients
      ORDER BY stock ASC
    `);
    res.json({ items: result.rows });
  } catch (err) {
    console.error('Error fetching inventory report:', err);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
});

// GET /api/manager/reports/xreport - Get X-Report (hourly sales summary matching Java Project 2)
app.get('/api/manager/reports/xreport', async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`X-Report: Fetching data for date=${reportDate}`);
    
    // Get hourly sales data - handle time as string by casting to TIME
    const hourlySalesResult = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM o.time::time) AS sale_hour,
        SUM(oi.price) AS hourly_total
      FROM orders o
      JOIN order_items oi ON o.orderid = oi.orderid
      WHERE o.date = $1
      GROUP BY sale_hour
      ORDER BY sale_hour
    `, [reportDate]);
    
    console.log(`X-Report: Hourly sales rows: ${hourlySalesResult.rows.length}`, hourlySalesResult.rows);
    
    // Get overall sales summary
    const salesResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.orderid) as total_transactions,
        COALESCE(SUM(oi.price), 0) as gross_sales,
        COUNT(DISTINCT oi.itemid) as total_items_sold
      FROM orders o
      LEFT JOIN order_items oi ON o.orderid = oi.orderid
      WHERE o.date = $1
    `, [reportDate]);
    
    // Get payment breakdown
    const paymentsResult = await pool.query(`
      SELECT 
        LOWER(payment_type) as payment_type,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM payments p
      JOIN orders o ON p.order_id = o.orderid
      WHERE o.date = $1
      GROUP BY LOWER(payment_type)
    `, [reportDate]);
    
    // Get category breakdown
    const categoriesResult = await pool.query(`
      SELECT 
        m.category as name,
        COUNT(oi.itemid) as items,
        SUM(oi.price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.drink = m.name
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date = $1
      GROUP BY m.category
    `, [reportDate]);
    
    // Get individual drinks breakdown
    const drinksResult = await pool.query(`
      SELECT 
        oi.drink as name,
        m.category,
        COUNT(oi.itemid) as items,
        SUM(oi.price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.drink = m.name
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date = $1
      GROUP BY oi.drink, m.category
      ORDER BY revenue DESC
    `, [reportDate]);
    
    // Get hourly transaction counts - handle time as string by casting to TIME
    const hourlyTransactionsResult = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM o.time::time) AS sale_hour,
        COUNT(DISTINCT o.orderid) AS transaction_count
      FROM orders o
      WHERE o.date = $1
      GROUP BY sale_hour
      ORDER BY sale_hour
    `, [reportDate]);
    
    console.log(`X-Report: Hourly transactions rows: ${hourlyTransactionsResult.rows.length}`, hourlyTransactionsResult.rows);
    
    // Transform hourly data to include both sales and transactions
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const salesRow = hourlySalesResult.rows.find(r => parseInt(r.sale_hour) === hour);
      const transRow = hourlyTransactionsResult.rows.find(r => parseInt(r.sale_hour) === hour);
      
      hourlyData.push({
        hour: hour,
        sales: parseFloat(salesRow?.hourly_total || 0),
        transactions: parseInt(transRow?.transaction_count || 0)
      });
    }
    
    // Get top sellers
    const topSellersResult = await pool.query(`
      SELECT 
        oi.drink as name,
        COUNT(oi.itemid) as quantity,
        SUM(oi.price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date = $1
      GROUP BY oi.drink
      ORDER BY revenue DESC
      LIMIT 10
    `, [reportDate]);
    
    console.log(`X-Report: Top sellers rows: ${topSellersResult.rows.length}`, topSellersResult.rows);
    console.log(`X-Report: Hourly data array:`, hourlyData.filter(h => h.transactions > 0 || h.sales > 0));
    
    res.json({
      date: reportDate,
      sales: {
        gross_sales: parseFloat(salesResult.rows[0].gross_sales || 0),
        returns: 0, // Future enhancement
        voids: 0,   // Future enhancement
        discards: 0, // Future enhancement
        net_sales: parseFloat(salesResult.rows[0].gross_sales || 0)
      },
      transactions: {
        totalTransactions: parseInt(salesResult.rows[0].total_transactions),
        cash: paymentsResult.rows.find(p => p.payment_type === 'cash') || { count: 0, amount: 0 },
        credit: paymentsResult.rows.find(p => p.payment_type === 'credit') || { count: 0, amount: 0 },
        debit: paymentsResult.rows.find(p => p.payment_type === 'debit') || { count: 0, amount: 0 }
      },
      hourly: hourlyData,
      topSellers: topSellersResult.rows,
      products: {
        totalItemsSold: parseInt(salesResult.rows[0].total_items_sold),
        categories: categoriesResult.rows,
        drinks: drinksResult.rows
      }
    });
  } catch (err) {
    console.error('Error fetching X-Report:', err);
    res.status(500).json({ error: 'Failed to fetch X-Report' });
  }
});

// GET /api/manager/reports/zreport - Get Z-Report (end of day report matching Java Project 2)
app.get('/api/manager/reports/zreport', async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    // Check if day is already finalized
    const finalizedCheck = await pool.query(`
      SELECT COUNT(*) FROM daily_totals WHERE reportdate = $1
    `, [reportDate]);
    
    const isFinalized = parseInt(finalizedCheck.rows[0].count) > 0;
    
    // Get comprehensive end-of-day data using order_items prices (matching Java)
    const salesResult = await pool.query(`
      SELECT 
        COALESCE(SUM(o.totalcost), 0) as total_sales,
        COUNT(o.orderid) as num_orders
      FROM orders o
      WHERE o.date = $1
    `, [reportDate]);
    
    // Get detailed transaction data
    const detailedSalesResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.orderid) as total_transactions,
        COALESCE(SUM(oi.price), 0) as gross_sales,
        0 as total_discounts,
        COALESCE(SUM(oi.price * 0.0825), 0) as total_taxes,
        COALESCE(SUM(oi.price), 0) as net_sales,
        COUNT(DISTINCT oi.itemid) as total_items_sold
      FROM orders o
      LEFT JOIN order_items oi ON o.orderid = oi.orderid
      WHERE o.date = $1
    `, [reportDate]);
    
    // Get payment breakdown
    const paymentsResult = await pool.query(`
      SELECT 
        LOWER(payment_type) as payment_type,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM payments p
      JOIN orders o ON p.order_id = o.orderid
      WHERE o.date = $1
      GROUP BY LOWER(payment_type)
    `, [reportDate]);
    
    // Get category breakdown
    const categoriesResult = await pool.query(`
      SELECT 
        m.category as name,
        COUNT(oi.itemid) as items,
        SUM(oi.price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.drink = m.name
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date = $1
      GROUP BY m.category
      ORDER BY revenue DESC
    `, [reportDate]);
    
    // Get top sellers
    const topSellersResult = await pool.query(`
      SELECT 
        m.name,
        COUNT(oi.itemid) as quantity,
        SUM(oi.price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.drink = m.name
      JOIN orders o ON oi.orderid = o.orderid
      WHERE o.date = $1
      GROUP BY m.name
      ORDER BY quantity DESC
      LIMIT 3
    `, [reportDate]);
    
    res.json({
      date: reportDate,
      isFinalized: isFinalized,
      sales: detailedSalesResult.rows[0],
      totals: {
        totalSales: parseFloat(salesResult.rows[0].total_sales),
        totalOrders: parseInt(salesResult.rows[0].num_orders)
      },
      transactions: {
        totalTransactions: parseInt(detailedSalesResult.rows[0].total_transactions),
        cash: paymentsResult.rows.find(p => p.payment_type === 'cash') || { count: 0, amount: 0 },
        credit: paymentsResult.rows.find(p => p.payment_type === 'credit') || { count: 0, amount: 0 },
        debit: paymentsResult.rows.find(p => p.payment_type === 'debit') || { count: 0, amount: 0 }
      },
      products: {
        totalItemsSold: parseInt(detailedSalesResult.rows[0].total_items_sold),
        categories: categoriesResult.rows
      },
      topSellers: topSellersResult.rows
    });
  } catch (err) {
    console.error('Error fetching Z-Report:', err);
    res.status(500).json({ error: 'Failed to fetch Z-Report' });
  }
});

// POST /api/manager/reports/zreport/finalize - Finalize Z-Report (matching Java Project 2)
app.post('/api/manager/reports/zreport/finalize', async (req, res) => {
  try {
    const { date } = req.body;
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    // Check if already finalized
    const checkResult = await pool.query(`
      SELECT COUNT(*) FROM daily_totals WHERE reportdate = $1
    `, [reportDate]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'This day has already been finalized' });
    }
    
    // Calculate final totals (matching Java SQL)
    const salesResult = await pool.query(`
      SELECT 
        COALESCE(SUM(totalcost), 0) as total_sales,
        COUNT(orderid) as num_orders
      FROM orders
      WHERE date = $1
    `, [reportDate]);
    
    const totalSales = parseFloat(salesResult.rows[0].total_sales);
    const totalOrders = parseInt(salesResult.rows[0].num_orders);
    
    // Insert into daily_totals table (matching Java implementation)
    await pool.query(`
      INSERT INTO daily_totals (reportdate, totalsales, totalorders, finalizedtimestamp)
      VALUES ($1, $2, $3, $4)
    `, [reportDate, totalSales, totalOrders, new Date()]);
    
    res.json({
      success: true,
      message: 'Z-Report finalized successfully',
      data: {
        reportDate,
        totalSales,
        totalOrders,
        finalizedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error finalizing Z-Report:', err);
    res.status(500).json({ error: 'Failed to finalize Z-Report' });
  }
});

app.listen(port, () => {
  console.log(`Kiosk backend server running on http://localhost:${port}`);
});