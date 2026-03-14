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

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hash, role, phone || null]
    );

    const user = { id: result.insertId, name, email, role };
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

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = 1', [email]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user   = rows[0];
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
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, avatar_url, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// ── Update profile ────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const avatar_url = req.file?.location || undefined;

    const fields = [];
    const vals   = [];

    if (name)       { fields.push('name = ?');       vals.push(name); }
    if (phone)      { fields.push('phone = ?');      vals.push(phone); }
    if (avatar_url) { fields.push('avatar_url = ?'); vals.push(avatar_url); }

    if (!fields.length) return res.status(400).json({ message: 'Nothing to update' });

    vals.push(req.user.id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);

    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

// ── Change password ────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [rows] = await db.query(
      'SELECT password_hash FROM users WHERE id = ?', [req.user.id]
    );
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(400).json({ message: 'Current password is wrong' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ message: 'Password changed' });
  } catch (err) {
    next(err);
  }
};
