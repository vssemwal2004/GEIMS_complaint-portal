/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting to protect against brute force attacks and API abuse.
 * Different limits for authentication endpoints vs general API endpoints.
 * 
 * Security Considerations:
 * - IP-based rate limiting
 * - Stricter limits on login/auth endpoints
 * - Graceful 429 responses with retry information
 * - Sliding window algorithm for fair limiting
 */

import rateLimit from 'express-rate-limit';

/**
 * Standard API message generator for rate limit responses
 * @param {number} retryAfter - Seconds until rate limit resets
 * @returns {Object} JSON response object
 */
const createLimitMessage = (retryAfter) => ({
  success: false,
  message: 'Too many requests. Please try again later.',
  retryAfter: Math.ceil(retryAfter / 1000), // Convert to seconds
});

/**
 * Login/Authentication rate limiter
 * Strict limit: 5 attempts per 15 minutes per IP
 * Protects against brute force password attacks
 */
export const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5, // 5 attempts
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false, // Count all requests
  message: (req, res) => {
    return createLimitMessage(res.getHeader('Retry-After') * 1000);
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  // Key generator - use IP address
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if behind a proxy, otherwise use IP
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * General API rate limiter
 * Standard limit: 100 requests per 15 minutes per IP
 * Protects against API abuse
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 100, // 100 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: (req, res) => {
    return createLimitMessage(res.getHeader('Retry-After') * 1000);
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * File upload rate limiter
 * Limit: 10 uploads per 15 minutes per IP
 * Protects against storage abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads
  standardHeaders: true,
  legacyHeaders: false,
  message: (req, res) => {
    return createLimitMessage(res.getHeader('Retry-After') * 1000);
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many file uploads. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * Password reset rate limiter
 * Limit: 3 attempts per hour per IP
 * Protects against email enumeration and spam
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please try again in an hour.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * Create custom rate limiter with user-based limiting
 * Combines IP and user ID for more granular control
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limiter middleware
 */
export const createUserBasedLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: (req, res) => createLimitMessage(res.getHeader('Retry-After') * 1000),
    keyGenerator: (req) => {
      // Combine IP and user ID (if authenticated)
      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.user ? req.user._id.toString() : 'anonymous';
      return `${ip}-${userId}`;
    },
    ...options,
  });
};

/**
 * Complaint submission rate limiter (per user)
 * Limit: 5 complaints per day per user
 * Protects against complaint spam and email abuse
 */
export const complaintLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.COMPLAINT_RATE_LIMIT_MAX, 10) || 5, // 5 complaints per day
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'You have reached the daily complaint limit (5 per day). Please try again tomorrow.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  keyGenerator: (req) => {
    // Use user ID for authenticated requests
    return req.userId || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip for admins (they don't submit complaints but just in case)
    return req.userRole === 'ADMIN';
  },
});

export default {
  loginLimiter,
  apiLimiter,
  uploadLimiter,
  passwordResetLimiter,
  createUserBasedLimiter,
  complaintLimiter,
};
