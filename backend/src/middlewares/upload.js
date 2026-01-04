/**
 * File Upload Middleware
 * 
 * Handles secure file uploads using Multer.
 * Restricted to image files only with size limits.
 * 
 * Security Considerations:
 * - File type validation (images only)
 * - File size limits (5MB max)
 * - Secure filename generation
 * - File extension validation
 * - MIME type verification
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Maximum file size (5MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024;

/**
 * Storage configuration
 * Files are stored with secure random names to prevent:
 * - Path traversal attacks
 * - Filename collisions
 * - Enumeration attacks
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    
    // Format: timestamp-randomhex.extension
    cb(null, `${timestamp}-${randomName}${ext}`);
  },
});

/**
 * File filter function
 * Validates file type by checking:
 * 1. MIME type
 * 2. File extension
 * @param {Request} req
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error('Invalid file type. Only JPG, JPEG, and PNG images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error('Invalid file extension. Only .jpg, .jpeg, and .png are allowed.');
    error.code = 'INVALID_EXTENSION';
    return cb(error, false);
  }

  // File is valid
  cb(null, true);
};

/**
 * Multer upload configuration
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB limit
    files: 1, // Only 1 file per request
  },
});

/**
 * Single image upload middleware
 * @param {string} fieldName - Form field name for the image
 * @returns {Function} Multer middleware
 */
export const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        // Handle Multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: 'Too many files. Only 1 file is allowed per upload.',
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: `Unexpected field name. Use '${fieldName}' for file upload.`,
            });
          }
        }

        // Handle custom errors
        if (err.code === 'INVALID_FILE_TYPE' || err.code === 'INVALID_EXTENSION') {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        // Generic error
        console.error('Upload error:', err);
        return res.status(500).json({
          success: false,
          message: 'File upload failed. Please try again.',
        });
      }

      next();
    });
  };
};

/**
 * Get the URL path for an uploaded file
 * @param {string} filename - The filename
 * @returns {string} URL path to the file
 */
export const getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

/**
 * Delete uploaded file (for cleanup)
 * @param {string} filepath - Full path to the file
 * @returns {Promise<void>}
 */
export const deleteFile = async (filepath) => {
  const fs = await import('fs/promises');
  try {
    await fs.unlink(filepath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error deleting file:', error);
    }
  }
};

export default {
  uploadSingle,
  getFileUrl,
  deleteFile,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
};
