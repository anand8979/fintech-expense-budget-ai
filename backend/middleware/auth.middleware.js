import { verifyToken } from '../config/jwt.js';

// Authentication middleware (protect)
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role || 'user'; // Default to 'user' for backward compatibility
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Role information missing.' 
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Alias for backward compatibility
export const protect = authenticate;
