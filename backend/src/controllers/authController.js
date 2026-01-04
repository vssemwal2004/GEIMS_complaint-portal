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
import { sendPasswordChangedEmail } from '../services/emailService.js';
import { asyncHandler, AuthenticationError, ValidationError } from '../middlewares/errorHandler.js';

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

export default {
  login,
  changePassword,
  getMe,
  logout,
  verifyToken,
};
