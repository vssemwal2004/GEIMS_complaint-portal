/**
 * Validation Middleware
 * 
 * Provides middleware functions for validating request data using Zod schemas.
 * Ensures all input data meets schema requirements before processing.
 * 
 * Security Considerations:
 * - Schema-based validation prevents injection attacks
 * - Unknown fields are rejected
 * - Type coercion handled safely
 * - Clear error messages for debugging
 */

import { ZodError } from 'zod';
import validator from 'validator';

/**
 * Validate request body against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      // Parse and validate request body
      const validated = schema.parse(req.body);
      
      // Replace body with validated/transformed data
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      // Pass other errors to error handler
      next(error);
    }
  };
};

/**
 * Validate request params against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors,
        });
      }

      next(error);
    }
  };
};

/**
 * Validate request query against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors,
        });
      }

      next(error);
    }
  };
};

/**
 * Sanitize string inputs to prevent XSS
 * Escapes HTML entities in string values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Escape HTML entities
      sanitized[key] = validator.escape(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? validator.escape(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Middleware to sanitize request body
 * Use AFTER validation for safe data
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Note: We don't sanitize passwords as they should be hashed anyway
    const fieldsToSkip = ['password', 'currentPassword', 'newPassword', 'confirmPassword'];
    
    for (const [key, value] of Object.entries(req.body)) {
      if (!fieldsToSkip.includes(key) && typeof value === 'string') {
        req.body[key] = validator.escape(value);
      }
    }
  }
  next();
};

/**
 * Validate MongoDB ObjectId parameter
 * @param {string} paramName - Name of the param to validate
 * @returns {Function} Express middleware function
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`,
      });
    }

    // Check if it's a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

export default {
  validateBody,
  validateParams,
  validateQuery,
  sanitizeObject,
  sanitizeBody,
  validateObjectId,
};
