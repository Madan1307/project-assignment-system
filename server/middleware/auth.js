/**
 * Role-check middleware.
 * Attach to any route group that needs access control.
 */

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    // API request → JSON error; page request → redirect
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login');
  }
  if (req.session.role !== 'admin') {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return res.redirect('/dashboard');
  }
  next();
}

function requireUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login');
  }
  if (req.session.role !== 'user') {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ error: 'User access required' });
    }
    return res.redirect('/admin/projects');
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireUser };
