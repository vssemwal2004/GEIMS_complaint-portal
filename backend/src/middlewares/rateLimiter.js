/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting to protect against brute force attacks and API abuse.
 * Different limits for authentication endpoints vs general API endpoints.
 * 
 * Security Considerations:
 * - User/Email-based rate limiting (not just IP-based)
 * - Each user has their own rate limit quota
 * - One user's abuse won't affect other users
 * - Stricter limits on login/auth endpoints
 * - Graceful 429 responses with retry information
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
  retryAfter: Math.ceil(retryAfter / 1000),
});

/**
 * Login/Authentication rate limiter
 * Strict limit: 5 attempts per 15 minutes PER EMAIL
 * Protects against brute force password attacks
 * Each user has their own limit - one user's failed attempts won't affect others
 */
export const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5, // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: (req, res) => {
    return createLimitMessage(res.getHeader('Retry-After') * 1000);
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts for this account. Please try again in 15 minutes.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  // Key generator - use EMAIL (user-specific) instead of just IP
  keyGenerator: (req) => {
    // Use email from request body for login attempts (user-specific limiting)
    const email = req.body?.email?.toLowerCase()?.trim();
    if (email) {
      return `login:${email}`;
    }
    // Fallback to IP only if no email provided
    return `login:ip:${req.ip || req.connection.remoteAddress}`;
  },
});

/**
 * General API rate limiter
 * Standard limit: 100 requests per 15 minutes PER USER
 * For authenticated routes - uses user ID
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
  // Key generator - use USER ID for authenticated requests
  keyGenerator: (req) => {
    // Use user ID if authenticated (set by auth middleware)
    if (req.userId) {
      return `api:user:${req.userId}`;
    }
    // Fallback to IP for unauthenticated requests
    return `api:ip:${req.ip || req.connection.remoteAddress}`;
  },
});

/**
 * File upload rate limiter
 * Limit: 10 uploads per 15 minutes PER USER
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
  // Key generator - use USER ID
  keyGenerator: (req) => {
    if (req.userId) {
      return `upload:user:${req.userId}`;
    }
    return `upload:ip:${req.ip || req.connection.remoteAddress}`;
  },
});

/**
 * Password reset rate limiter
 * Limit: 3 attempts per hour PER EMAIL
 * Protects against email enumeration and spam
 * Each email has its own limit
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per email
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests for this email. Please try again in an hour.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  // Key generator - use EMAIL for forgot-password, or token for reset-password
  keyGenerator: (req) => {
    // For forgot-password - use email
    const email = req.body?.email?.toLowerCase()?.trim();
    if (email) {
      return `pwreset:${email}`;
    }
    // For reset-password with token - extract email from token or use token itself
    const token = req.body?.token;
    if (token) {
      return `pwreset:token:${token.substring(0, 20)}`; // Use first 20 chars of token
    }
    // Fallback to IP
    return `pwreset:ip:${req.ip || req.connection.remoteAddress}`;
  },
});

/**
 * Complaint submission rate limiter (per user)
 * Limit: 5 complaints per day per user
 * Protects against complaint spam
 * Each student has their own limit
 */
export const complaintLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.COMPLAINT_RATE_LIMIT_MAX, 10) || 5, // 5 complaints per day
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'You have reached your daily complaint limit (5 per day). Please try again tomorrow.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  // Key generator - use USER ID (user-specific)
  keyGenerator: (req) => {
    // Use user ID for authenticated requests
    if (req.userId) {
      return `complaint:user:${req.userId}`;
    }
    // This shouldn't happen as complaints require auth, but fallback to IP
    return `complaint:ip:${req.ip || req.connection.remoteAddress}`;
  },
  skip: (req) => {
    // Skip for admins
    return req.userRole === 'ADMIN';
  },
});

/**
 * Complaint submission cooldown limiter
 * Limit: 1 complaint per 5 minutes per user
 * Prevents rapid-fire complaint submissions
 */
export const complaintCooldownLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1, // 1 complaint per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Please wait at least 5 minutes between complaint submissions.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
  keyGenerator: (req) => {
    if (req.userId) {
      return `complaint-cooldown:user:${req.userId}`;
    }
    return `complaint-cooldown:ip:${req.ip || req.connection.remoteAddress}`;
  },
  skip: (req) => {
    return req.userRole === 'ADMIN';
  },
});

/**
 * Create custom rate limiter with user-based limiting
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
      // Use user ID if authenticated
      if (req.userId) {
        return `custom:user:${req.userId}`;
      }
      return `custom:ip:${req.ip || req.connection.remoteAddress}`;
    },
    ...options,
  });
};

export default {
  loginLimiter,
  apiLimiter,
  uploadLimiter,
  passwordResetLimiter,
  complaintLimiter,
  complaintCooldownLimiter,
  createUserBasedLimiter,
};
