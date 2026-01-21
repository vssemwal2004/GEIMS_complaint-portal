/**
 * Employee Routes
 * 
 * Defines routes for employee-specific operations.
 * All routes require authentication and employee role.
 * 
 * Security:
 * - Authentication required
 * - Employee role required
 * - Input validation
 */

import express from 'express';
import employeeController from '../controllers/employeeController.js';
import { authenticate, requireEmployee, checkPasswordChange } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import { validateBody, validateObjectId } from '../middlewares/validate.js';
import { 
  createComplaintSchema, 
  reopenComplaintSchema, 
  rateComplaintSchema, 
  acknowledgeComplaintSchema 
} from '../validators/schemas.js';

const router = express.Router();

// Apply authentication and employee role to all routes
router.use(authenticate);
router.use(requireEmployee);
router.use(checkPasswordChange);
router.use(apiLimiter);

/**
 * @route   GET /api/employee/dashboard
 * @desc    Get employee dashboard statistics
 * @access  Employee only
 */
router.get('/dashboard', employeeController.getDashboardStats);

/**
 * @route   GET /api/employee/complaints
 * @desc    Get employee's own complaints
 * @access  Employee only
 */
router.get('/complaints', employeeController.getMyComplaints);

/**
 * @route   POST /api/employee/complaints
 * @desc    Submit a new complaint
 * @access  Employee only
 */
router.post(
  '/complaints',
  validateBody(createComplaintSchema),
  employeeController.submitComplaint
);

/**
 * @route   GET /api/employee/complaints/:id
 * @desc    Get single complaint details
 * @access  Employee only
 */
router.get(
  '/complaints/:id',
  validateObjectId('id'),
  employeeController.getComplaintById
);

/**
 * @route   POST /api/employee/complaints/:id/reopen
 * @desc    Reopen a resolved complaint
 * @access  Employee only
 */
router.post(
  '/complaints/:id/reopen',
  validateObjectId('id'),
  validateBody(reopenComplaintSchema),
  employeeController.reopenComplaint
);

/**
 * @route   POST /api/employee/complaints/:id/rate
 * @desc    Rate a resolved complaint
 * @access  Employee only
 */
router.post(
  '/complaints/:id/rate',
  validateObjectId('id'),
  validateBody(rateComplaintSchema),
  employeeController.rateComplaint
);

/**
 * @route   POST /api/employee/complaints/:id/acknowledge
 * @desc    Acknowledge a resolved complaint
 * @access  Employee only
 */
router.post(
  '/complaints/:id/acknowledge',
  validateObjectId('id'),
  validateBody(acknowledgeComplaintSchema),
  employeeController.acknowledgeComplaint
);

export default router;
