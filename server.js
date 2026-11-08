const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const STUDENT_VARIANT = process.env.STUDENT_VARIANT || '5';

// Деректер қорына қосылу баптаулары
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <h1>Қойма жүйесі жұмыс істеп тұр.</h1>
    <a href="/api/items" style="font-size: 20px; color: blue; text-decoration: underline;">Тауарлар тізімін көру (/api/items)</a>
  `);
});

app.get('/info', (req, res) => {
  res.json({
    status: 'ok',
    variant: STUDENT_VARIANT,
    project: 'Қойманы басқару',
  });
});

// --- REST API МАРШРУТТАРЫ ---

// 1. Барлық тауарларды оқу (GET)
app.get('/api/items', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM items ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Бір тауарды id бойынша оқу (GET)
app.get('/api/items/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM items WHERE id=$1', [req.params.id]);
    res.json(r.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Жаңа тауар қосу (POST)
app.post('/api/items', async (req, res) => {
  try {
    const { name, quantity } = req.body;
    const r = await pool.query(
      'INSERT INTO items (name, quantity) VALUES ($1, $2) RETURNING *',
      [name, quantity]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});