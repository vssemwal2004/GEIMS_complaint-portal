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
 * Forgot password rate limiter - 2 requests per 2 hours **per IP + email**
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 2 * 60 * 60 * 1000, // 2 hours
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req /*, res */) => {
    const ip =
      req.ip ||
      (req.headers['x-forwarded-for']
        ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
        : '') ||
      (req.connection && req.connection.remoteAddress) ||
      'unknown-ip';

    const email = (req.body && req.body.email ? String(req.body.email) : '').toLowerCase();

    return `${ip}:${email}`;
  },
  handler: (req, res /*, next */) => {
    const retryAfterSeconds = req.rateLimit?.resetTime
      ? Math.max(0, Math.round((req.rateLimit.resetTime.getTime() - Date.now()) / 1000))
      : 2 * 60 * 60;

    res.status(429).json({
      success: false,
      message: 'Reset link limit reached for this email from this device. Please try again later.',
      retryAfter: retryAfterSeconds,
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
