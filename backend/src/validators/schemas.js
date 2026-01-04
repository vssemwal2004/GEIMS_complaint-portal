/**
 * Zod Validation Schemas
 * 
 * Centralized validation schemas for all API inputs.
 * Uses Zod for type-safe, schema-based validation.
 * 
 * Security Considerations:
 * - Strict validation prevents injection attacks
 * - Unknown fields are rejected by default
 * - Email format validation
 * - Password complexity requirements
 * - Content length limits enforced
 */

import { z } from 'zod';
import validator from 'validator';

/**
 * Custom Zod refinement for email validation using validator.js
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(255, 'Email cannot exceed 255 characters')
  .email('Invalid email format')
  .transform((val) => val.toLowerCase().trim())
  .refine((val) => validator.isEmail(val), {
    message: 'Invalid email format',
  });

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .refine(
    (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
    'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
  );

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
}).strict(); // Reject unknown fields

/**
 * Password change validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).strict().refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
}).strict();

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).strict().refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Single student creation schema
 */
export const createStudentSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .refine(
      (val) => /^[a-zA-Z\s'-]+$/.test(val),
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  email: emailSchema,
  college: z
    .string()
    .min(2, 'College name must be at least 2 characters')
    .max(200, 'College name cannot exceed 200 characters')
    .trim(),
}).strict();

/**
 * CSV student row validation schema
 */
export const csvStudentSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: emailSchema,
  college: z
    .string()
    .min(2, 'College name must be at least 2 characters')
    .max(200, 'College name cannot exceed 200 characters')
    .trim(),
});

/**
 * Helper function to count words in a string
 * @param {string} text
 * @returns {number}
 */
const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Complaint creation schema
 */
export const createComplaintSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content cannot exceed 50000 characters')
    .trim()
    .refine(
      (val) => countWords(val) >= 10,
      'Content must contain at least 10 words'
    )
    .refine(
      (val) => countWords(val) <= 5000,
      'Content cannot exceed 5000 words'
    ),
}).strict();

/**
 * Complaint status update schema
 */
export const updateComplaintStatusSchema = z.object({
  status: z.enum(['READ', 'UNDER_REVIEW', 'RESOLVED'], {
    errorMap: () => ({ message: 'Status must be READ, UNDER_REVIEW, or RESOLVED' }),
  }),
  acknowledgment: z
    .string()
    .min(1, 'Acknowledgment is required when resolving')
    .max(5000, 'Acknowledgment cannot exceed 5000 characters')
    .trim()
    .optional(),
}).strict().refine(
  (data) => {
    // If status is RESOLVED, acknowledgment is required
    if (data.status === 'RESOLVED' && !data.acknowledgment) {
      return false;
    }
    return true;
  },
  {
    message: 'Acknowledgment is required when status is RESOLVED',
    path: ['acknowledgment'],
  }
);

/**
 * MongoDB ObjectId validation schema
 */
export const objectIdSchema = z
  .string()
  .min(1, 'ID is required')
  .refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val),
    'Invalid ID format'
  );

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '1', 10))
    .refine((val) => val > 0, 'Page must be positive'),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '10', 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  status: z
    .enum(['READ', 'UNDER_REVIEW', 'RESOLVED', 'all'])
    .optional()
    .default('all'),
});

/**
 * Sanitize string to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return validator.escape(str);
};

/**
 * Validate and sanitize input against a schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {Object} data - Data to validate
 * @returns {Object} - Validated and transformed data
 */
export const validateInput = (schema, data) => {
  return schema.parse(data);
};

export default {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStudentSchema,
  csvStudentSchema,
  createComplaintSchema,
  updateComplaintStatusSchema,
  objectIdSchema,
  paginationSchema,
  validateInput,
  sanitizeString,
};
