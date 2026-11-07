const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const STUDENT_VARIANT = process.env.STUDENT_VARIANT || '5';

const items = [
  {
    id: 1,
    name: 'Ноутбук',
    category: 'Электроника',
    quantity: 12,
    unit: 'дана',
    location: 'A-01',
  },
  {
    id: 2,
    name: 'Кеңсе қағазы',
    category: 'Кеңсе тауарлары',
    quantity: 45,
    unit: 'қаптама',
    location: 'B-03',
  },
  {
    id: 3,
    name: 'Пернетақта',
    category: 'Компьютер жабдықтары',
    quantity: 20,
    unit: 'дана',
    location: 'A-04',
  },
];

app.get('/', (req, res) => {
  res.send(`
    <h1>Қойма жүйесі жұмыс істеп тұр.</h1>
    <a href="/items" style="font-size: 20px; color: blue; text-decoration: underline;">Тауарлар тізімін көру (/items)</a>
  `);
});

app.get('/info', (req, res) => {
  res.json({
    status: 'ok',
    variant: STUDENT_VARIANT,
    project: 'Қойманы басқару',
  });
});

app.get('/items', (req, res) => {
  res.json(items);
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
