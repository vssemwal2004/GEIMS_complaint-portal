/**
 * Student Routes
 * 
 * Defines routes for student-specific operations.
 * All routes require authentication and student role.
 * 
 * Security:
 * - Authentication required
 * - Student role required
 * - Input validation
 * - File upload validation for images
 */

import express from 'express';
import studentController from '../controllers/studentController.js';
import { authenticate, requireStudent, checkPasswordChange } from '../middlewares/auth.js';
import { apiLimiter, complaintLimiter, complaintCooldownLimiter } from '../middlewares/rateLimiter.js';
import { validateBody, validateObjectId } from '../middlewares/validate.js';
import { createComplaintSchema } from '../validators/schemas.js';

const router = express.Router();

// Apply authentication and student role to all routes
router.use(authenticate);
router.use(requireStudent);
router.use(checkPasswordChange);
router.use(apiLimiter);

/**
 * @route   GET /api/student/profile
 * @desc    Get student profile
 * @access  Student only
 */
router.get('/profile', studentController.getProfile);

/**
 * @route   GET /api/student/stats
 * @desc    Get student complaint statistics
 * @access  Student only
 */
router.get('/stats', studentController.getMyStats);

/**
 * @route   GET /api/student/complaints
 * @desc    Get student's complaints
 * @access  Student only
 */
router.get('/complaints', studentController.getMyComplaints);

/**
 * @route   GET /api/student/complaints/:id
 * @desc    Get single complaint
 * @access  Student only (own complaints)
 */
router.get(
  '/complaints/:id',
  validateObjectId('id'),
  studentController.getComplaint
);

/**
 * @route   POST /api/student/complaints
 * @desc    Submit a new complaint
 * @access  Student only
 * @limit   5 complaints per day per user, 5 min cooldown between complaints
 */
router.post(
  '/complaints',
  complaintCooldownLimiter,
  complaintLimiter,
  validateBody(createComplaintSchema),
  studentController.submitComplaint
);

export default router;
