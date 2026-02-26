require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const catalogRoutes = require('./routes/catalog');
const contentRoutes = require('./routes/content');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS — разрешаем только ваш сайт ───────────────────────────────────────
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'https://m3-mobile.ru',
  'https://www.m3-mobile.ru',
  'http://localhost:3000', // для локальной разработки
  'http://localhost:5500',
];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (curl, Postman) и из списка разрешённых
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ─── Rate limiting — защита от перегрузки ───────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 60,             // максимум 60 запросов в минуту с одного IP
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─── Body parser ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health check для Railway ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api', catalogRoutes);
app.use('/api', contentRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ OCS proxy running on port ${PORT}`);
  console.log(`   Shipment city: ${process.env.OCS_SHIPMENT_CITY || 'Москва'}`);
  console.log(`   Environment: ${process.env.OCS_ENV === 'test' ? 'TEST' : 'PRODUCTION'}`);
});
