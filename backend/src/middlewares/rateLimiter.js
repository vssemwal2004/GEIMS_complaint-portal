/**
 * Rate Limiting Middleware
 * 
 * Optimized for low-memory environments (512MB free tier).
 * Uses IP-based limiting to keep memory usage bounded.
 * User-specific limits (like 5 complaints/day) handled at database level.
 */

import rateLimit from 'express-rate-limit';

/**
 * Login rate limiter - 10 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: 900,
    });
  },
});

/**
 * General API rate limiter - 200 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
      retryAfter: 900,
    });
  },
});

/**
 * Upload rate limiter - 20 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many uploads. Please try again later.',
      retryAfter: 900,
    });
  },
});

/**
 * Password reset rate limiter - 5 attempts per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please try again in an hour.',
      retryAfter: 3600,
    });
  },
});

/**
 * Forgot password rate limiter - 5 requests per hour per IP
 * IMPORTANT: Always responds with a generic 200 to prevent email enumeration.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
    });
  },
});

/**
 * Complaint rate limiter - 10 complaints per hour per IP
 * (User-specific daily limit of 5 is enforced in the controller via database)
 */
export const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many complaint submissions. Please try again later.',
      retryAfter: 3600,
    });
  },
});

/**
 * Complaint cooldown - handled at database level now
 * This is a simple pass-through for backwards compatibility
 */
export const complaintCooldownLimiter = (req, res, next) => next();

export default {
  loginLimiter,
  apiLimiter,
  uploadLimiter,
  passwordResetLimiter,
  forgotPasswordLimiter,
  complaintLimiter,
  complaintCooldownLimiter,
};
