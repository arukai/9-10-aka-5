const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const STUDENT_VARIANT = process.env.STUDENT_VARIANT || '5';

// 1. Безопасная конфигурация
// Ссылка теперь берется из Render (Environment Variables), а не пишется в коде открыто
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// 8. Журналдау (Логирование)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// 7. /health endpoint[cite: 23]
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

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

app.get('/api/items', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM items ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    console.error('Database error:', err.message); // 6. Орталықтан өңдеу (Скрываем детали ошибки)[cite: 23]
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM items WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' }); // 5. 404 жауабын өңдеу[cite: 22, 23]
    }
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/items', async (req, res) => {
  // 4. Кіріс деректерін валидациялау (Проверка обязательных полей)[cite: 22]
  const { name, quantity } = req.body;
  if (!name || quantity === undefined) {
    return res.status(400).json({ error: 'name және quantity міндетті' });
  }

  try {
    const r = await pool.query(
      'INSERT INTO items (name, quantity) VALUES ($1, $2) RETURNING *',
      [name, quantity]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});