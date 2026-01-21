/**
 * Authentication Middleware
 * 
 * Handles JWT token verification and role-based access control.
 * Protects routes by verifying user identity and permissions.
 * 
 * Security Considerations:
 * - Token verification on every protected request
 * - Role-based access control (RBAC)
 * - Token expiration handling
 * - No sensitive data in error responses
 */

import jwt from 'jsonwebtoken';
import User, { USER_ROLES } from '../models/User.js';

/**
 * Verify JWT token and attach user to request
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Also check for token in cookies (for browser-based requests)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // No token provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.',
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
        });
      }
      throw error;
    }

    // Find user and verify still exists and active
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Please contact administrator.',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
};

/**
 * Require specific role(s) for access
 * Must be used AFTER authenticate middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    // Ensure authenticate was called first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

/**
 * Require admin role
 * Convenience middleware for admin-only routes
 */
export const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Require admin or sub-admin role
 * Convenience middleware for routes accessible to both admin and sub-admin
 */
export const requireAdminOrSubAdmin = requireRole(USER_ROLES.ADMIN, USER_ROLES.SUB_ADMIN);

/**
 * Require student role
 * Convenience middleware for student-only routes
 */
export const requireStudent = requireRole(USER_ROLES.STUDENT);

/**
 * Require employee role
 * Convenience middleware for employee-only routes
 */
export const requireEmployee = requireRole(USER_ROLES.EMPLOYEE);

/**
 * Require student or employee role
 * Convenience middleware for routes accessible to both students and employees
 */
export const requireStudentOrEmployee = requireRole(USER_ROLES.STUDENT, USER_ROLES.EMPLOYEE);

/**
 * Check if password change is required
 * Blocks access to other routes if forcePasswordChange is true
 */
export const checkPasswordChange = (req, res, next) => {
  // Skip check for password change endpoint itself
  if (req.path === '/change-password') {
    return next();
  }

  if (req.user && req.user.forcePasswordChange) {
    return res.status(403).json({
      success: false,
      message: 'Password change required. Please change your password first.',
      requirePasswordChange: true,
    });
  }

  next();
};

/**
 * Generate JWT token for user
 * @param {Object} user - User document
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

export default {
  authenticate,
  requireRole,
  requireAdmin,
  requireAdminOrSubAdmin,
  requireStudent,
  requireEmployee,
  requireStudentOrEmployee,
  checkPasswordChange,
  generateToken,
};
