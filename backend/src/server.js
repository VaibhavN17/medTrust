const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const routes     = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const missingRequiredEnv = ['JWT_SECRET'].filter((key) => !process.env[key]);
if (missingRequiredEnv.length) {
  console.error(
    `❌ Missing required environment variable(s): ${missingRequiredEnv.join(', ')}`
  );
  console.error('Create backend/.env from backend/.env.example and set missing values.');
  process.exit(1);
}

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || '*',
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────────────────────────
const authRateLimitMax = Number(
  process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 20 : 200)
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, slow down.' },
});

// Keep brute-force protection on credential endpoints only.
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Local uploads (dev/local fallback) ────────────────────────────────────
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Error handler (must be last) ─────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MedTrust API running on port ${PORT} [${process.env.NODE_ENV}]`);
});
