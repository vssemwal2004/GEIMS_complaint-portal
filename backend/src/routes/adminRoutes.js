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
import { 
  createStudentSchema, 
  createSubAdminSchema, 
  createEmployeeSchema, 
  updateComplaintStatusSchema 
} from '../validators/schemas.js';

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
 * @route   PUT /api/admin/students/:id
 * @desc    Update student details
 * @access  Admin only
 */
router.put(
  '/students/:id',
  validateObjectId('id'),
  validateBody(createStudentSchema),
  adminController.updateStudent
);

/**
 * @route   DELETE /api/admin/students/:id
 * @desc    Delete a student
 * @access  Admin only
 */
router.delete(
  '/students/:id',
  validateObjectId('id'),
  adminController.deleteStudent
);

/**
 * @route   GET /api/admin/sub-admins
 * @desc    Get all sub-admins
 * @access  Admin only
 */
router.get('/sub-admins', adminController.getAllSubAdmins);

/**
 * @route   POST /api/admin/sub-admins
 * @desc    Create a single sub-admin
 * @access  Admin only
 */
router.post(
  '/sub-admins',
  validateBody(createSubAdminSchema),
  adminController.createSubAdmin
);

/**
 * @route   POST /api/admin/sub-admins/csv
 * @desc    Create multiple sub-admins from CSV
 * @access  Admin only
 */
router.post(
  '/sub-admins/csv',
  csvUpload.single('file'),
  adminController.createSubAdminsFromCSV
);

/**
 * @route   PUT /api/admin/sub-admins/:id
 * @desc    Update sub-admin details
 * @access  Admin only
 */
router.put(
  '/sub-admins/:id',
  validateObjectId('id'),
  validateBody(createSubAdminSchema),
  adminController.updateSubAdmin
);

/**
 * @route   DELETE /api/admin/sub-admins/:id
 * @desc    Delete a sub-admin
 * @access  Admin only
 */
router.delete(
  '/sub-admins/:id',
  validateObjectId('id'),
  adminController.deleteSubAdmin
);

/**
 * @route   GET /api/admin/employees
 * @desc    Get all employees
 * @access  Admin only
 */
router.get('/employees', adminController.getAllEmployees);

/**
 * @route   POST /api/admin/employees
 * @desc    Create a single employee
 * @access  Admin only
 */
router.post(
  '/employees',
  validateBody(createEmployeeSchema),
  adminController.createEmployee
);

/**
 * @route   POST /api/admin/employees/csv
 * @desc    Create multiple employees from CSV
 * @access  Admin only
 */
router.post(
  '/employees/csv',
  csvUpload.single('file'),
  adminController.createEmployeesFromCSV
);

/**
 * @route   PUT /api/admin/employees/:id
 * @desc    Update employee details
 * @access  Admin only
 */
router.put(
  '/employees/:id',
  validateObjectId('id'),
  validateBody(createEmployeeSchema),
  adminController.updateEmployee
);

/**
 * @route   DELETE /api/admin/employees/:id
 * @desc    Delete an employee
 * @access  Admin only
 */
router.delete(
  '/employees/:id',
  validateObjectId('id'),
  adminController.deleteEmployee
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

/**
 * @route   GET /api/admin/reports
 * @desc    Generate and download complaint report
 * @access  Admin only
 */
router.get('/reports', adminController.generateReport);

export default router;
