/**
 * Admin Routes
 * 
 * Defines routes for admin-specific operations.
 * All routes require authentication and admin role.
 * 
 * Security:
 * - Authentication required
 * - Admin role required
 * - Input validation
 * - File upload validation for CSV
 */

import express from 'express';
import multer from 'multer';
import adminController from '../controllers/adminController.js';
import { authenticate, requireAdmin, checkPasswordChange } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import { validateBody, validateObjectId } from '../middlewares/validate.js';
import { createStudentSchema, updateComplaintStatusSchema } from '../validators/schemas.js';

const router = express.Router();

// CSV upload configuration (memory storage for processing)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for CSV
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

// Apply authentication and admin role to all routes
router.use(authenticate);
router.use(requireAdmin);
router.use(checkPasswordChange);
router.use(apiLimiter);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/stats', adminController.getStats);

/**
 * @route   GET /api/admin/students
 * @desc    Get all students
 * @access  Admin only
 */
router.get('/students', adminController.getAllStudents);

/**
 * @route   GET /api/admin/students/:id
 * @desc    Get single student details
 * @access  Admin only
 */
router.get(
  '/students/:id',
  validateObjectId('id'),
  adminController.getStudent
);

/**
 * @route   POST /api/admin/students
 * @desc    Create a single student
 * @access  Admin only
 */
router.post(
  '/students',
  validateBody(createStudentSchema),
  adminController.createStudent
);

/**
 * @route   POST /api/admin/students/csv
 * @desc    Create multiple students from CSV
 * @access  Admin only
 */
router.post(
  '/students/csv',
  csvUpload.single('file'),
  adminController.createStudentsFromCSV
);

/**
 * @route   GET /api/admin/complaints
 * @desc    Get all complaints
 * @access  Admin only
 */
router.get('/complaints', adminController.getAllComplaints);

/**
 * @route   PATCH /api/admin/complaints/:id/status
 * @desc    Update complaint status
 * @access  Admin only
 */
router.patch(
  '/complaints/:id/status',
  validateObjectId('id'),
  validateBody(updateComplaintStatusSchema),
  adminController.updateComplaintStatus
);

export default router;
