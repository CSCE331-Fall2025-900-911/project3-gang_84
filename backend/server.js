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
    //    I am assuming you have a 'category' column in your 'menu_items' table.
    //    If it's named something else (e.g., 'item_type'), change it here.
    const categoriesPromise = pool.query('SELECT DISTINCT category FROM menu_items ORDER BY category');

    // Wait for both queries to finish
    const [menuItemsResult, categoriesResult] = await Promise.all([
      menuItemsPromise,
      categoriesPromise,
    ]);

    // Send the structured data
    res.json({
      // Send back the categories, e.g., [{category: 'Milky Series'}, {category: 'Fruity Beverage'}]
      categories: categoriesResult.rows,
      // Send back all the drinks
      menu_items: menuItemsResult.rows,
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching the menu.' });
  }
});


app.listen(port, () => {
  console.log(`Kiosk backend server running on http://localhost:${port}`);
});