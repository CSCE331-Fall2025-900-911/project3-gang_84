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
    const menuItemsPromise = pool.query('SELECT * FROM menu_items');
    
    const categoriesPromise = pool.query('SELECT DISTINCT category FROM menu_items ORDER BY category');

    const [menuItemsResult, categoriesResult] = await Promise.all([
      menuItemsPromise,
      categoriesPromise,
    ]);

    res.json({
      categories: categoriesResult.rows,
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