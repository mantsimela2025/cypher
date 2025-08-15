// Simple auth middlewares leveraging existing req.user and role associations

function ensureAuthenticated(req, res, next) {
  // AUTH_BYPASS feature disabled - authentication is always required
  // if (req.authBypassed === true) return next();
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  // also allow tests to pass a header for bypass when no session is present
  if (req.user) return next();
  return res.status(401).json({ success: false, error: 'Unauthorized' });
}

function ensureAdmin(req, res, next) {
  // AUTH_BYPASS feature disabled - authorization is always required
  // if (req.authBypassed === true) return next();

  const user = req.user;
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  // Common patterns: user.role === 'admin' or user.roles includes 'admin'
  if (user.role === 'admin') return next();
  if (Array.isArray(user.roles) && user.roles.some(r => r.name === 'admin' || r === 'admin')) return next();
  if (user.isAdmin) return next();
  return res.status(403).json({ success: false, error: 'Forbidden' });
}

module.exports = { ensureAuthenticated, ensureAdmin };
