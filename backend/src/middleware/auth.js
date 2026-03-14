const jwt = require('jsonwebtoken');

/**
 * Verify JWT and attach req.user
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: 'JWT_SECRET is not configured on the server. Set it in backend/.env.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;          // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Role guard – pass one or more allowed roles
 * @example authorize('admin', 'ngo')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
  }
  next();
};

module.exports = { authenticate, authorize };
