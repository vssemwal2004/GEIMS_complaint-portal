/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the application.
 * Provides consistent error responses while hiding sensitive information.
 * 
 * Security Considerations:
 * - No stack traces in production
 * - No internal error details exposed
 * - Proper HTTP status codes
 * - Logging for debugging
 */

import { ZodError } from 'zod';
import mongoose from 'mongoose';

/**
 * Custom API Error class
 * Extends Error with additional properties for API responses
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Indicates this is a known error

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 400, errors);
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends APIError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Format Zod validation errors into a user-friendly format
 * @param {ZodError} zodError
 * @returns {Object[]}
 */
const formatZodErrors = (zodError) => {
  return zodError.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Format Mongoose validation errors
 * @param {mongoose.Error.ValidationError} mongooseError
 * @returns {Object[]}
 */
const formatMongooseValidationErrors = (mongooseError) => {
  return Object.values(mongooseError.errors).map((err) => ({
    field: err.path,
    message: err.message,
  }));
};

/**
 * Handle duplicate key error from MongoDB
 * @param {Error} error
 * @returns {Object}
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue || {})[0];
  return {
    message: `${field ? `${field.charAt(0).toUpperCase() + field.slice(1)}` : 'Value'} already exists`,
    field,
  };
};

/**
 * Global error handler middleware
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // Log error for debugging (with stack trace in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    // In production, only log essential info
    console.error('Error:', {
      message: err.message,
      statusCode,
      path: req.path,
      method: req.method,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = formatZodErrors(err);
  }

  // Handle Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = formatMongooseValidationErrors(err);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid ID format';
    errors = [{ field: err.path, message: `Invalid ${err.path}` }];
  }

  // Handle MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    const dupError = handleDuplicateKeyError(err);
    message = dupError.message;
    errors = [{ field: dupError.field, message: dupError.message }];
  }

  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't expose internal errors in production
  if (!err.isOperational && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong. Please try again later.';
    errors = null;
  }

  // Send error response
  const response = {
    success: false,
    message,
  };

  // Include errors array if present
  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Catches requests to non-existent routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes to error handler
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  APIError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
};
