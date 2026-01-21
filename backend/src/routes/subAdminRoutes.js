/**
 * Sub-Admin Routes
 * 
 * Defines routes for sub-admin-specific operations.
 * All routes require authentication and sub-admin role.
 * 
 * Security:
 * - Authentication required
 * - Sub-admin role required
 * - Department-based access control
 */

import express from 'express';
import subAdminController from '../controllers/subAdminController.js';
import { authenticate, requireAdminOrSubAdmin, checkPasswordChange } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import { validateBody, validateObjectId } from '../middlewares/validate.js';
import { updateComplaintStatusSchema } from '../validators/schemas.js';

const router = express.Router();

// Apply authentication and sub-admin role to all routes
router.use(authenticate);
router.use(requireAdminOrSubAdmin);
router.use(checkPasswordChange);
router.use(apiLimiter);

/**
 * @route   GET /api/sub-admin/stats
 * @desc    Get dashboard statistics for sub-admin's department
 * @access  Sub-Admin only
 */
router.get('/stats', subAdminController.getStats);

/**
 * @route   GET /api/sub-admin/complaints
 * @desc    Get complaints for sub-admin's department
 * @access  Sub-Admin only
 */
router.get('/complaints', subAdminController.getComplaintsForDepartment);

/**
 * @route   PATCH /api/sub-admin/complaints/:id/status
 * @desc    Update complaint status
 * @access  Sub-Admin only
 */
router.patch(
  '/complaints/:id/status',
  validateObjectId('id'),
  validateBody(updateComplaintStatusSchema),
  subAdminController.updateComplaintStatus
);

/**
 * @route   GET /api/sub-admin/reports
 * @desc    Generate and download complaint report for department
 * @access  Sub-Admin only
 */
router.get('/reports', subAdminController.generateReport);

/**
 * @route   GET /api/sub-admin/students
 * @desc    Get students for sub-admin's department
 * @access  Sub-Admin only
 */
router.get('/students', subAdminController.getStudentsForDepartment);

/**
 * @route   GET /api/sub-admin/employees
 * @desc    Get employees for sub-admin's department
 * @access  Sub-Admin only
 */
router.get('/employees', subAdminController.getEmployeesForDepartment);

export default router;
