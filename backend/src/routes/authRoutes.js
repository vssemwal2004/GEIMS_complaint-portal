/**
 * Authentication Routes
 * 
 * Defines routes for authentication operations.
 * Single login endpoint for both Admin and Student roles.
 * 
 * Security:
 * - Rate limiting on login endpoint
 * - Input validation
 * - JWT token for protected routes
 */

import express from 'express';
import authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { loginLimiter, passwordResetLimiter, forgotPasswordLimiter } from '../middlewares/rateLimiter.js';
import { validateBody } from '../middlewares/validate.js';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/schemas.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user (Admin or Student)
 * @access  Public (rate limited)
 */
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request a password reset link
 * @access  Public (rate limited)
 */
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using emailed token
 * @access  Public (rate limited)
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get(
  '/verify',
  authenticate,
  authController.verifyToken
);

export default router;
