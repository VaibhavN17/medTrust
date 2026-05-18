const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const mailer  = require('../utils/mailer');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const err = new Error(
      'JWT_SECRET is not configured. Set it in backend/.env (copy backend/.env.example).'
    );
    err.statusCode = 500;
    throw err;
  }
  return process.env.JWT_SECRET;
};

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Register ──────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'donor', phone } = req.body;

    // Check if email exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1', 
      [email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, email, hash, role, phone || null]
    );

    const userId = result.rows[0].id;
    const user = { id: userId, name, email, role };
    const token = signToken(user);

    // Welcome email (non-blocking)
    mailer.sendWelcome(email, name).catch(console.error);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true', 
      [email]
    );
    if (!result.rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user   = result.rows[0];
    const match  = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    const { password_hash, ...safe } = user;

    res.json({ token, user: safe });
  } catch (err) {
    next(err);
  }
};

// ── Get own profile ───────────────────────────────────────────────────────
exports.me = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, phone, avatar_url, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// ── Update profile ────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const avatar_url = req.file?.location || undefined;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name)       { updates.push(`name = $${paramCount++}`);       values.push(name); }
    if (phone)      { updates.push(`phone = $${paramCount++}`);      values.push(phone); }
    if (avatar_url) { updates.push(`avatar_url = $${paramCount++}`); values.push(avatar_url); }

    if (!updates.length) return res.status(400).json({ message: 'Nothing to update' });

    values.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`, values);

    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

// ── Change password ────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1', 
      [req.user.id]
    );
    const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!match) return res.status(400).json({ message: 'Current password is wrong' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

    res.json({ message: 'Password changed' });
  } catch (err) {
    next(err);
  }
};
