const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Store user info in session
    req.session.userId = user.user_id;
    req.session.name   = user.name;
    req.session.role   = user.role;

    res.json({
      userId: user.user_id,
      name:   user.name,
      role:   user.role,
      redirect: user.role === 'admin' ? '/admin/projects' : '/dashboard'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me — check current session
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    userId: req.session.userId,
    name:   req.session.name,
    role:   req.session.role
  });
});

module.exports = router;
