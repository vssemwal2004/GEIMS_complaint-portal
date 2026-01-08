/**
 * Authentication Controller
 * 
 * Handles user authentication, login, and password management.
 * Supports both Admin and Student roles through a single login endpoint.
 * 
 * Security Considerations:
 * - Password hashing with bcrypt
 * - JWT token generation
 * - Force password change on first login
 * - Rate limiting on login attempts (handled by middleware)
 */

import User, { USER_ROLES } from '../models/User.js';
import { generateToken } from '../middlewares/auth.js';
import { sendPasswordChangedEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { asyncHandler, AuthenticationError, ValidationError } from '../middlewares/errorHandler.js';
import crypto from 'crypto';

/**
 * Login user (Admin or Student)
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field included
  const user = await User.findByEmailWithPassword(email);

  if (!user) {
    // Use generic message to prevent email enumeration
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated. Please contact administrator.');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken(user);

  // Prepare user response (without sensitive data)
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    college: user.college,
    forcePasswordChange: user.forcePasswordChange,
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token,
      requirePasswordChange: user.forcePasswordChange,
    },
  });
});

/**
 * Change password
 * POST /api/auth/change-password
 * Requires authentication
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  // Find user with password
  const user = await User.findById(userId).select('+passwordHash');

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ValidationError('Current password is incorrect');
  }

  // Check if new password is same as current
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new ValidationError('New password must be different from current password');
  }

  // Update password (will be hashed by pre-save hook)
  user.passwordHash = newPassword;
  user.forcePasswordChange = false;
  await user.save();

  // Send confirmation email (async, don't wait)
  sendPasswordChangedEmail({
    email: user.email,
    name: user.name,
  }).catch(err => console.error('Failed to send password changed email:', err));

  // Generate new token with updated info
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        forcePasswordChange: false,
      },
    },
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 * Requires authentication
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        forcePasswordChange: user.forcePasswordChange,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    },
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 * Clears cookie if using cookie-based auth
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear cookie if present
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Verify token validity
 * GET /api/auth/verify
 * Requires authentication
 */
export const verifyToken = asyncHandler(async (req, res) => {
  // If middleware passed, token is valid
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        forcePasswordChange: req.user.forcePasswordChange,
      },
    },
  });
});

/**
 * Forgot password
 * POST /api/auth/forgot-password
 *
 * Rate limiting behaviour:
 * - Handled by forgotPasswordLimiter middleware (2 requests / 2 hours
 *   per IP + email combination).
 * - This controller only enforces user/account checks, not global
 *   cooldowns, so requests for other emails or from other IPs are
 *   unaffected.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Wrong email. This email is not registered.',
    });
  }

  const now = new Date();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresMinutes = 60;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpires = expiresAt;

  // Generate reset URL
  const frontendBaseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

  // CRITICAL: Send email FIRST - if it fails, don't increment counter
  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
      expiresMinutes,
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    // Email failed - do NOT update DB, return error
    return res.status(500).json({
      success: false,
      message: 'Cannot send the mail. Please try again later.',
    });
  }
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
});

/**
 * Reset password via emailed token
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordHash +passwordResetTokenHash +passwordResetExpires');

  if (!user) {
    throw new ValidationError('Reset link is invalid or has expired');
  }

  user.passwordHash = newPassword;
  user.forcePasswordChange = false;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;

  // Reset forgot-password cooldown state once the password is successfully reset.
  user.forgotPasswordConsecutiveCount = 0;
  user.forgotPasswordCooldownUntil = undefined;
  await user.save();

  // Optional confirmation
  sendPasswordChangedEmail({
    email: user.email,
    name: user.name,
  }).catch((err) => console.error('Failed to send password changed email:', err));

  return res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.',
  });
});

export default {
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  verifyToken,
};
