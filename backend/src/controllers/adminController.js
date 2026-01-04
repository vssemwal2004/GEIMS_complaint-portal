/**
 * Admin Controller
 * 
 * Handles admin-specific operations including student management
 * and complaint review functionality.
 * 
 * Security Considerations:
 * - Admin-only access (enforced by middleware)
 * - Input validation for all operations
 * - Secure password generation for new students
 * - CSV validation to prevent injection
 */

import crypto from 'crypto';
import { parse } from 'csv-parse/sync';
import User, { USER_ROLES } from '../models/User.js';
import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import { sendAccountCreatedEmail, sendComplaintResolvedEmail, sendStatusUpdateEmail } from '../services/emailService.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middlewares/errorHandler.js';
import { csvStudentSchema } from '../validators/schemas.js';

/**
 * Generate a secure random password
 * @returns {string} Random password meeting complexity requirements
 */
const generateSecurePassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  // Ensure at least one of each required character type
  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];
  
  // Fill remaining length with random characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle the password
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
};

/**
 * Create a single student
 * POST /api/admin/students
 */
export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, college } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('A user with this email already exists');
  }

  // Generate secure random password
  const temporaryPassword = generateSecurePassword();

  // Create student
  const student = new User({
    name,
    email: email.toLowerCase(),
    college,
    passwordHash: temporaryPassword, // Will be hashed by pre-save hook
    role: USER_ROLES.STUDENT,
    forcePasswordChange: true,
  });

  await student.save();

  // Send welcome email with credentials (async)
  sendAccountCreatedEmail({
    email: student.email,
    name: student.name,
    temporaryPassword,
    college: student.college,
  }).catch(err => console.error('Failed to send welcome email:', err));

  res.status(201).json({
    success: true,
    message: 'Student created successfully. Login credentials sent via email.',
    data: {
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        college: student.college,
        createdAt: student.createdAt,
      },
    },
  });
});

/**
 * Create multiple students via CSV upload
 * POST /api/admin/students/csv
 */
export const createStudentsFromCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('CSV file is required');
  }

  // Parse CSV content
  const csvContent = req.file.buffer.toString('utf-8');
  
  let records;
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // Only allow expected columns
      on_record: (record) => {
        // Filter to only expected fields
        return {
          name: record.name,
          email: record.email,
          college: record.college,
        };
      },
    });
  } catch (error) {
    throw new ValidationError('Invalid CSV format. Please check your file structure.');
  }

  if (!records || records.length === 0) {
    throw new ValidationError('CSV file is empty or has no valid records');
  }

  // Validate and process each record
  const results = {
    created: [],
    failed: [],
  };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNumber = i + 2; // +2 for header row and 1-based index

    try {
      // Validate record against schema
      const validatedRecord = csvStudentSchema.parse(record);

      // Check if email already exists
      const existingUser = await User.findOne({ email: validatedRecord.email.toLowerCase() });
      if (existingUser) {
        results.failed.push({
          row: rowNumber,
          email: validatedRecord.email,
          reason: 'Email already exists',
        });
        continue;
      }

      // Generate secure password
      const temporaryPassword = generateSecurePassword();

      // Create student
      const student = new User({
        name: validatedRecord.name,
        email: validatedRecord.email.toLowerCase(),
        college: validatedRecord.college,
        passwordHash: temporaryPassword,
        role: USER_ROLES.STUDENT,
        forcePasswordChange: true,
      });

      await student.save();

      // Send welcome email (async)
      sendAccountCreatedEmail({
        email: student.email,
        name: student.name,
        temporaryPassword,
        college: student.college,
      }).catch(err => console.error(`Failed to send email to ${student.email}:`, err));

      results.created.push({
        row: rowNumber,
        email: student.email,
        name: student.name,
      });

    } catch (error) {
      results.failed.push({
        row: rowNumber,
        email: record.email || 'N/A',
        reason: error.errors ? error.errors.map(e => e.message).join(', ') : error.message,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Processed ${records.length} records. ${results.created.length} created, ${results.failed.length} failed.`,
    data: {
      totalProcessed: records.length,
      created: results.created.length,
      failed: results.failed.length,
      details: {
        created: results.created,
        failed: results.failed,
      },
    },
  });
});

/**
 * Get all students
 * GET /api/admin/students
 */
export const getAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const query = { role: USER_ROLES.STUDENT };

  // Add search filter if provided
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const students = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      students,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
    },
  });
});

/**
 * Get all complaints (for admin review)
 * GET /api/admin/complaints
 */
export const getAllComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  const total = await Complaint.countDocuments(query);
  const complaints = await Complaint.findAllWithUser(query)
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      complaints,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    },
  });
});

/**
 * Update complaint status
 * PATCH /api/admin/complaints/:id/status
 */
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, acknowledgment } = req.body;

  // Find complaint with user details
  const complaint = await Complaint.findById(id).populate('userId', 'name email');

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  // Update status
  complaint.status = status;

  // If resolving, add acknowledgment
  if (status === COMPLAINT_STATUS.RESOLVED) {
    if (!acknowledgment) {
      throw new ValidationError('Acknowledgment is required when resolving a complaint');
    }
    complaint.acknowledgment = acknowledgment;
    complaint.resolvedBy = req.userId;
    complaint.resolvedAt = new Date();
  }

  await complaint.save();

  // Get user details for email
  const student = complaint.userId;

  // Send email notification
  if (status === COMPLAINT_STATUS.RESOLVED) {
    sendComplaintResolvedEmail({
      email: student.email,
      name: student.name,
      complaintId: complaint._id.toString(),
      acknowledgment,
      submittedAt: complaint.createdAt,
    }).catch(err => console.error('Failed to send resolution email:', err));
  } else {
    sendStatusUpdateEmail({
      email: student.email,
      name: student.name,
      complaintId: complaint._id.toString(),
      status,
    }).catch(err => console.error('Failed to send status update email:', err));
  }

  // Fetch updated complaint with populated fields
  const updatedComplaint = await Complaint.findById(id)
    .populate('userId', 'name email college')
    .populate('resolvedBy', 'name email');

  res.status(200).json({
    success: true,
    message: `Complaint status updated to ${status}`,
    data: {
      complaint: updatedComplaint,
    },
  });
});

/**
 * Get complaint statistics
 * GET /api/admin/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalComplaints,
    readComplaints,
    underReviewComplaints,
    resolvedComplaints,
  ] = await Promise.all([
    User.countDocuments({ role: USER_ROLES.STUDENT }),
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: COMPLAINT_STATUS.READ }),
    Complaint.countDocuments({ status: COMPLAINT_STATUS.UNDER_REVIEW }),
    Complaint.countDocuments({ status: COMPLAINT_STATUS.RESOLVED }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalStudents,
        totalComplaints,
        byStatus: {
          read: readComplaints,
          underReview: underReviewComplaints,
          resolved: resolvedComplaints,
        },
      },
    },
  });
});

/**
 * Get single student details
 * GET /api/admin/students/:id
 */
export const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await User.findOne({ 
    _id: id, 
    role: USER_ROLES.STUDENT 
  }).select('-passwordHash');

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Get student's complaints
  const complaints = await Complaint.find({ userId: id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      student,
      complaints,
    },
  });
});

export default {
  createStudent,
  createStudentsFromCSV,
  getAllStudents,
  getAllComplaints,
  updateComplaintStatus,
  getStats,
  getStudent,
};
