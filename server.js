const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const STUDENT_VARIANT = process.env.STUDENT_VARIANT || '5';

// 1. Безопасная конфигурация
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

// 7. /health endpoints
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

// ЖАҢАРТЫЛҒАН БАСТЫ БЕТ (3 СІЛТЕМЕ-БАТЫРМА)
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1>Қойма жүйесі жұмыс істеп тұр.</h1>
      <div style="font-size: 20px; line-height: 2;">
        <a href="/api/items" style="color: blue; text-decoration: underline;">📦 Тауарлар тізімін көру (/api/items)</a><br>
        <a href="/health" style="color: green; text-decoration: underline;">🟢 Сервер жұмысын тексеру (/health)</a><br>
        <a href="/health/db" style="color: orange; text-decoration: underline;">🗄️ Базаға қосылымды тексеру (/health/db)</a>
      </div>
    </div>
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

// GET All
app.get('/api/items', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM items ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    console.error('Database error:', err.message); 
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET by ID
app.get('/api/items/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM items WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' }); 
    }
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST
app.post('/api/items', async (req, res) => {
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

// DELETE - Тауарды өшіру (8-ші практика талабы)
app.delete('/api/items/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM items WHERE id=$1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ message: 'Тауар өшірілді', deletedItem: r.rows[0] });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});