const express = require('express');
const session = require('express-session');
const path    = require('path');

const authRoutes  = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes  = require('./routes/user');
const { requireAdmin, requireUser } = require('./middleware/auth');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000   // 8 hours
  }
}));

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../client')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);
app.use('/api/user',  requireUser,  userRoutes);

// ── Page Routes ───────────────────────────────────────────────────────────────
app.get('/',         (_req, res) => res.sendFile(path.join(__dirname, '../client/login.html')));
app.get('/login',    (_req, res) => res.sendFile(path.join(__dirname, '../client/login.html')));

app.get('/admin/projects',    requireAdmin, (_req, res) =>
  res.sendFile(path.join(__dirname, '../client/admin/projects.html')));
app.get('/admin/projects/:id', requireAdmin, (_req, res) =>
  res.sendFile(path.join(__dirname, '../client/admin/project-detail.html')));

app.get('/dashboard', requireUser, (_req, res) =>
  res.sendFile(path.join(__dirname, '../client/user/dashboard.html')));
app.get('/task/:id',  requireUser, (_req, res) =>
  res.sendFile(path.join(__dirname, '../client/user/task.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
