const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token from the request header.
 */
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];

  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied',
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user payload (id, role, etc.)
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token is not valid',
    });
  }
};

/**
 * Optional: role‑based middleware
 * @param {string[]} allowedRoles - array of roles allowed to access the route
 */
module.exports.authorize = (allowedRoles = ['admin']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient rights' });
    }
    next();
  };
};

/**
 * Optional: extract user from token without blocking (for optional auth)
 */
module.exports.optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  next();
};