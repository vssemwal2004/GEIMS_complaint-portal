/**
 * User Model
 * 
 * Defines the schema for users (both Admin and Student roles).
 * Includes password hashing, role-based access, and first-login tracking.
 * 
 * Security Considerations:
 * - Passwords are hashed using bcrypt with strong salt rounds
 * - Password field is excluded from queries by default
 * - Email uniqueness enforced at database level
 * - Role-based access control support
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define user roles as constants for consistency
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true, // Allow null for admins
      // Only required for students, validated in controller
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // Email validation regex
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    college: {
      type: String,
      trim: true,
      maxlength: [200, 'College name cannot exceed 200 characters'],
      // College is optional for admin
      required: function () {
        return this.role === USER_ROLES.STUDENT;
      },
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      // Stored as a bcrypt hash; pre-save hook ensures hashing.
      // Validation does not enforce length so we can accept
      // plain text here before hashing.
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: 'Role must be either ADMIN or STUDENT',
      },
      default: USER_ROLES.STUDENT,
    },
    forcePasswordChange: {
      type: Boolean,
      default: true, // Students must change password on first login
    },
    // Track login attempts for security monitoring
    lastLogin: {
      type: Date,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Password reset (secure token stored as hash)
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      // Transform output to remove sensitive fields
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster email lookups
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

/**
 * Hash password before saving (if modified)
 * Uses bcrypt with 12 salt rounds for strong security
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is modified (or new)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    // Generate salt with 12 rounds (recommended for production)
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare provided password with stored hash
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Static method to find user by email with password
 * Used for authentication
 * @param {string} email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+passwordHash');
};

/**
 * Check if user is admin
 * @returns {boolean}
 */
userSchema.methods.isAdmin = function () {
  return this.role === USER_ROLES.ADMIN;
};

/**
 * Check if user is student
 * @returns {boolean}
 */
userSchema.methods.isStudent = function () {
  return this.role === USER_ROLES.STUDENT;
};

const User = mongoose.model('User', userSchema);

export default User;
