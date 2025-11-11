const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { db } = require('./config');

const app = express();
const port = 3001;
const pool = new Pool(db);

app.use(cors());
app.use(express.json());

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
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching the menu.' });
  }
});
app.listen(port, () => {
  console.log(`Kiosk backend server running on http://localhost:${port}`);
});