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
import { Parser } from 'json2csv';
import User, { USER_ROLES } from '../models/User.js';
import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import { sendAccountCreatedEmail, sendComplaintResolvedEmail, sendStatusUpdateEmail, sendAccountUpdatedEmail, sendAccountDeletedEmail } from '../services/emailService.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middlewares/errorHandler.js';
import { csvStudentSchema, csvSubAdminSchema, csvEmployeeSchema } from '../validators/schemas.js';

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
  const { studentId, name, email, college, department } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('A user with this email already exists');
  }

  // Check if studentId already exists
  const existingStudentId = await User.findOne({ studentId: studentId.trim() });
  if (existingStudentId) {
    throw new ValidationError('A student with this Student ID already exists');
  }

  // Generate secure random password
  const temporaryPassword = generateSecurePassword();

  // Create student
  const student = new User({
    studentId: studentId.trim(),
    name,
    email: email.toLowerCase(),
    college,
    department,
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
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        college: student.college,
        department: student.department,
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

  // Validate file type
  if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
    throw new ValidationError('Only CSV files are allowed. Please upload a .csv file');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    throw new ValidationError('File size exceeds 5MB limit');
  }

  // Parse CSV content
  const csvContent = req.file.buffer.toString('utf-8');
  
  let records;
  let headers = [];
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // Capture headers for validation
      on_header: (header) => {
        headers = header;
      },
      // Only allow expected columns - support multiple header variations
      on_record: (record) => {
        // Support common header variations (case-insensitive matching)
        const getField = (variations) => {
          for (const key of Object.keys(record)) {
            const lowerKey = key.toLowerCase().replace(/[\\s_-]/g, '');
            for (const v of variations) {
              if (lowerKey === v.toLowerCase().replace(/[\\s_-]/g, '')) {
                return record[key];
              }
            }
          }
          return undefined;
        };

        return {
          studentId: getField(['studentId', 'student_id', 'Student ID', 'StudentID', 'id']),
          name: getField(['name', 'studentName', 'Student Name', 'fullName', 'Full Name']),
          email: getField(['email', 'gmail', 'Email', 'Gmail', 'emailAddress', 'Email Address']),
          college: getField(['college', 'College', 'institution', 'Institution']),
          department: getField(['department', 'Department', 'course', 'Course', 'program', 'Program', 'degree', 'Degree']),
        };
      },
    });
  } catch (error) {
    throw new ValidationError('Invalid CSV format. Please ensure your file has proper CSV structure with headers: studentId, name, email, college, department');
  }

  if (!records || records.length === 0) {
    throw new ValidationError('CSV file is empty or has no valid data rows. Please add at least one student record');
  }

  // Validate required columns exist
  const requiredColumns = ['studentId', 'name', 'email', 'college', 'department'];
  const firstRecord = records[0];
  const missingColumns = requiredColumns.filter(col => !firstRecord[col] && firstRecord[col] !== '');
  
  if (missingColumns.length > 0) {
    throw new ValidationError(`Missing required columns in CSV: ${missingColumns.join(', ')}. Please use the template with headers: studentId, name, email, college, department`);
  }

  // Limit number of records (max 500 at once)
  if (records.length > 500) {
    throw new ValidationError(`Too many records. Maximum 500 students can be uploaded at once. Your file has ${records.length} records`);
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

      // Check if studentId already exists
      const existingStudentId = await User.findOne({ studentId: validatedRecord.studentId.trim() });
      if (existingStudentId) {
        results.failed.push({
          row: rowNumber,
          email: validatedRecord.email,
          reason: `Student ID "${validatedRecord.studentId}" already exists`,
        });
        continue;
      }

      // Generate secure password
      const temporaryPassword = generateSecurePassword();

      // Create student
      const student = new User({
        studentId: validatedRecord.studentId.trim(),
        name: validatedRecord.name,
        email: validatedRecord.email.toLowerCase(),
        college: validatedRecord.college,
        department: validatedRecord.department,
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
 * Update student details
 * PUT /api/admin/students/:id
 */
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentId, name, email, college, department } = req.body;

  // Find the student
  const student = await User.findOne({ _id: id, role: USER_ROLES.STUDENT });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Check if email is being changed and if it already exists
  if (email && email.toLowerCase() !== student.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('A user with this email already exists');
    }
  }

  // Check if studentId is being changed and if it already exists
  if (studentId && studentId.trim() !== student.studentId) {
    const existingStudentId = await User.findOne({ studentId: studentId.trim() });
    if (existingStudentId) {
      throw new ValidationError('A student with this Student ID already exists');
    }
  }

  // Update fields
  const oldEmail = student.email;
  const changes = {};
  
  if (studentId && studentId.trim() !== student.studentId) {
    changes['Student ID'] = studentId.trim();
    student.studentId = studentId.trim();
  }
  if (name && name !== student.name) {
    changes['Name'] = name;
    student.name = name;
  }
  if (email && email.toLowerCase() !== student.email) {
    changes['Email'] = email.toLowerCase();
    student.email = email.toLowerCase();
  }
  if (college && college !== student.college) {
    changes['College'] = college;
    student.college = college;
  }
  if (department && department !== student.department) {
    changes['Department'] = department;
    student.department = department;
  }

  await student.save();

  // Send email notification about account update
  if (Object.keys(changes).length > 0) {
    sendAccountUpdatedEmail({
      email: oldEmail, // Send to old email in case it was changed
      name: student.name,
      role: 'student',
      changes,
    }).catch(err => console.error('Failed to send account update email:', err));
  }

  res.status(200).json({
    success: true,
    message: 'Student updated successfully',
    data: {
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        college: student.college,
        department: student.department,
        updatedAt: student.updatedAt,
      },
    },
  });
});

/**
 * Delete a student
 * DELETE /api/admin/students/:id
 */
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the student first (before deletion) to get their details for email
  const student = await User.findOne({ _id: id, role: USER_ROLES.STUDENT });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Store student details before deletion
  const studentEmail = student.email;
  const studentName = student.name;

  // Delete the student
  await User.findOneAndDelete({ _id: id, role: USER_ROLES.STUDENT });

  // Send email notification about account deletion
  sendAccountDeletedEmail({
    email: studentEmail,
    name: studentName,
    role: 'student',
  }).catch(err => console.error('Failed to send account deletion email:', err));

  // Optionally, you might want to delete or archive associated complaints
  // For now, we'll just delete the student

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
  });
});

/**
 * Get all complaints (for admin review)
 * GET /api/admin/complaints
 */
export const getAllComplaints = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  // If no pagination params, return all complaints (optimized for admin dashboard)
  if (!page && !limit) {
    const complaints = await Complaint.find(query)
      .populate('userId', 'name email college studentId')
      .populate('resolvedBy', 'name email')
      .select('-imageUrl -reopenHistory') // Exclude heavy fields for list view
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    return res.status(200).json({
      success: true,
      data: {
        complaints,
      },
    });
  }

  // Paginated response
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  
  const total = await Complaint.countDocuments(query);
  const complaints = await Complaint.find(query)
    .populate('userId', 'name email college studentId')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      complaints,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
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
  const complaint = await Complaint.findById(id).populate('userId', 'name email studentId');

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  // Once a complaint is resolved, it cannot be updated again.
  if (complaint.status === COMPLAINT_STATUS.RESOLVED) {
    throw new ValidationError('Resolved complaints cannot be updated');
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
      complaintId: complaint.complaintId || complaint._id.toString(),
      subject: complaint.subject,
      content: complaint.content,
      acknowledgment,
      submittedAt: complaint.createdAt,
    }).catch(err => console.error('Failed to send resolution email:', err));
  } else {
    sendStatusUpdateEmail({
      email: student.email,
      name: student.name,
      complaintId: complaint.complaintId || complaint._id.toString(),
      subject: complaint.subject,
      status,
    }).catch(err => console.error('Failed to send status update email:', err));
  }

  // Fetch updated complaint with populated fields
  const updatedComplaint = await Complaint.findById(id)
    .populate('userId', 'name email college studentId')
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
  // Use aggregation for better performance instead of multiple countDocuments
  const [userStats, complaintStats] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]),
    Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Transform aggregation results into expected format
  const totalStudents = userStats.find(s => s._id === USER_ROLES.STUDENT)?.count || 0;
  const totalSubAdmins = userStats.find(s => s._id === USER_ROLES.SUB_ADMIN)?.count || 0;
  const totalEmployees = userStats.find(s => s._id === USER_ROLES.EMPLOYEE)?.count || 0;
  
  const readComplaints = complaintStats.find(s => s._id === COMPLAINT_STATUS.READ)?.count || 0;
  const underReviewComplaints = complaintStats.find(s => s._id === COMPLAINT_STATUS.UNDER_REVIEW)?.count || 0;
  const resolvedComplaints = complaintStats.find(s => s._id === COMPLAINT_STATUS.RESOLVED)?.count || 0;
  const totalComplaints = complaintStats.reduce((sum, s) => sum + s.count, 0);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalStudents,
        totalSubAdmins,
        totalEmployees,
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

/**
 * Create a single sub-admin
 * POST /api/admin/sub-admins
 */
export const createSubAdmin = asyncHandler(async (req, res) => {
  const { name, email, department } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('A user with this email already exists');
  }

  // Generate secure random password
  const temporaryPassword = generateSecurePassword();

  // Create sub-admin
  const subAdmin = new User({
    name,
    email: email.toLowerCase(),
    department,
    passwordHash: temporaryPassword, // Will be hashed by pre-save hook
    role: USER_ROLES.SUB_ADMIN,
    forcePasswordChange: true,
  });

  await subAdmin.save();

  // Send welcome email with credentials (async)
  sendAccountCreatedEmail({
    email: subAdmin.email,
    name: subAdmin.name,
    temporaryPassword,
    department: subAdmin.department,
  }).catch(err => console.error('Failed to send welcome email:', err));

  res.status(201).json({
    success: true,
    message: 'Sub-Admin created successfully. Login credentials sent via email.',
    data: {
      subAdmin: {
        id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        department: subAdmin.department,
        createdAt: subAdmin.createdAt,
      },
    },
  });
});

/**
 * Create multiple sub-admins via CSV upload
 * POST /api/admin/sub-admins/csv
 */
export const createSubAdminsFromCSV = asyncHandler(async (req, res) => {
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
      on_record: (record) => {
        const getField = (variations) => {
          for (const key of Object.keys(record)) {
            const lowerKey = key.toLowerCase().replace(/[\s_-]/g, '');
            for (const v of variations) {
              if (lowerKey === v.toLowerCase().replace(/[\s_-]/g, '')) {
                return record[key];
              }
            }
          }
          return undefined;
        };

        return {
          name: getField(['name', 'fullName', 'Full Name', 'subAdminName', 'Sub-Admin Name']),
          email: getField(['email', 'gmail', 'Email', 'Gmail', 'emailAddress', 'Email Address']),
          department: getField(['department', 'Department', 'dept', 'Dept']),
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
      const validatedRecord = csvSubAdminSchema.parse(record);

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

      // Create sub-admin
      const subAdmin = new User({
        name: validatedRecord.name,
        email: validatedRecord.email.toLowerCase(),
        department: validatedRecord.department,
        passwordHash: temporaryPassword,
        role: USER_ROLES.SUB_ADMIN,
        forcePasswordChange: true,
      });

      await subAdmin.save();

      // Send welcome email (async)
      sendAccountCreatedEmail({
        email: subAdmin.email,
        name: subAdmin.name,
        temporaryPassword,
        department: subAdmin.department,
      }).catch(err => console.error(`Failed to send email to ${subAdmin.email}:`, err));

      results.created.push({
        row: rowNumber,
        email: subAdmin.email,
        name: subAdmin.name,
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
 * Get all sub-admins
 * GET /api/admin/sub-admins
 */
export const getAllSubAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const query = { role: USER_ROLES.SUB_ADMIN };

  // Add search filter if provided
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const subAdmins = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      subAdmins,
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
 * Update sub-admin details
 * PUT /api/admin/sub-admins/:id
 */
export const updateSubAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, department, college } = req.body;

  // Find the sub-admin
  const subAdmin = await User.findOne({ _id: id, role: USER_ROLES.SUB_ADMIN });
  if (!subAdmin) {
    throw new NotFoundError('Sub-admin not found');
  }

  // Check if email is being changed and if it already exists
  if (email && email.toLowerCase() !== subAdmin.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('A user with this email already exists');
    }
  }

  // Update fields
  const oldEmail = subAdmin.email;
  const changes = {};
  
  if (name && name !== subAdmin.name) {
    changes['Name'] = name;
    subAdmin.name = name;
  }
  if (email && email.toLowerCase() !== subAdmin.email) {
    changes['Email'] = email.toLowerCase();
    subAdmin.email = email.toLowerCase();
  }
  if (department && department !== subAdmin.department) {
    changes['Department'] = department;
    subAdmin.department = department;
  }
  if (college && college !== subAdmin.college) {
    changes['College'] = college;
    subAdmin.college = college;
  }

  await subAdmin.save();

  // Send email notification about account update
  if (Object.keys(changes).length > 0) {
    sendAccountUpdatedEmail({
      email: oldEmail,
      name: subAdmin.name,
      role: 'sub-admin',
      changes,
    }).catch(err => console.error('Failed to send account update email:', err));
  }

  res.status(200).json({
    success: true,
    message: 'Sub-admin updated successfully',
    data: {
      subAdmin: {
        id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        department: subAdmin.department,
        college: subAdmin.college,
        updatedAt: subAdmin.updatedAt,
      },
    },
  });
});

/**
 * Delete a sub-admin
 * DELETE /api/admin/sub-admins/:id
 */
export const deleteSubAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the sub-admin first
  const subAdmin = await User.findOne({ _id: id, role: USER_ROLES.SUB_ADMIN });
  if (!subAdmin) {
    throw new NotFoundError('Sub-admin not found');
  }

  // Store details before deletion
  const subAdminEmail = subAdmin.email;
  const subAdminName = subAdmin.name;

  // Delete the sub-admin
  await User.findOneAndDelete({ _id: id, role: USER_ROLES.SUB_ADMIN });

  // Send email notification
  sendAccountDeletedEmail({
    email: subAdminEmail,
    name: subAdminName,
    role: 'sub-admin',
  }).catch(err => console.error('Failed to send account deletion email:', err));

  res.status(200).json({
    success: true,
    message: 'Sub-admin deleted successfully',
  });
});

/**
 * Create a single employee
 * POST /api/admin/employees
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, department, college } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('A user with this email already exists');
  }

  // Generate secure random password
  const temporaryPassword = generateSecurePassword();

  // Create employee
  const employee = new User({
    name,
    email: email.toLowerCase(),
    department,
    college,
    passwordHash: temporaryPassword, // Will be hashed by pre-save hook
    role: USER_ROLES.EMPLOYEE,
    forcePasswordChange: true,
  });

  await employee.save();

  // Send welcome email with credentials (async)
  sendAccountCreatedEmail({
    email: employee.email,
    name: employee.name,
    temporaryPassword,
    college: employee.college,
    department: employee.department,
  }).catch(err => console.error('Failed to send welcome email:', err));

  res.status(201).json({
    success: true,
    message: 'Employee created successfully. Login credentials sent via email.',
    data: {
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        college: employee.college,
        createdAt: employee.createdAt,
      },
    },
  });
});

/**
 * Create multiple employees via CSV upload
 * POST /api/admin/employees/csv
 */
export const createEmployeesFromCSV = asyncHandler(async (req, res) => {
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
      on_record: (record) => {
        const getField = (variations) => {
          for (const key of Object.keys(record)) {
            const lowerKey = key.toLowerCase().replace(/[\s_-]/g, '');
            for (const v of variations) {
              if (lowerKey === v.toLowerCase().replace(/[\s_-]/g, '')) {
                return record[key];
              }
            }
          }
          return undefined;
        };

        return {
          name: getField(['name', 'fullName', 'Full Name', 'employeeName', 'Employee Name']),
          email: getField(['email', 'gmail', 'Email', 'Gmail', 'emailAddress', 'Email Address']),
          department: getField(['department', 'Department', 'dept', 'Dept']),
          college: getField(['college', 'College', 'institution', 'Institution']),
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
      const validatedRecord = csvEmployeeSchema.parse(record);

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

      // Create employee
      const employee = new User({
        name: validatedRecord.name,
        email: validatedRecord.email.toLowerCase(),
        department: validatedRecord.department,
        college: validatedRecord.college,
        passwordHash: temporaryPassword,
        role: USER_ROLES.EMPLOYEE,
        forcePasswordChange: true,
      });

      await employee.save();

      // Send welcome email (async)
      sendAccountCreatedEmail({
        email: employee.email,
        name: employee.name,
        temporaryPassword,
        college: employee.college,
        department: employee.department,
      }).catch(err => console.error(`Failed to send email to ${employee.email}:`, err));

      results.created.push({
        row: rowNumber,
        email: employee.email,
        name: employee.name,
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
 * Get all employees
 * GET /api/admin/employees
 */
export const getAllEmployees = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const query = { role: USER_ROLES.EMPLOYEE };

  // Add search filter if provided
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const employees = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      employees,
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
 * Update employee details
 * PUT /api/admin/employees/:id
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, department, college } = req.body;

  // Find the employee
  const employee = await User.findOne({ _id: id, role: USER_ROLES.EMPLOYEE });
  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  // Check if email is being changed and if it already exists
  if (email && email.toLowerCase() !== employee.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('A user with this email already exists');
    }
  }

  // Update fields
  const oldEmail = employee.email;
  const changes = {};
  
  if (name && name !== employee.name) {
    changes['Name'] = name;
    employee.name = name;
  }
  if (email && email.toLowerCase() !== employee.email) {
    changes['Email'] = email.toLowerCase();
    employee.email = email.toLowerCase();
  }
  if (department && department !== employee.department) {
    changes['Department'] = department;
    employee.department = department;
  }
  if (college && college !== employee.college) {
    changes['College'] = college;
    employee.college = college;
  }

  await employee.save();

  // Send email notification about account update
  if (Object.keys(changes).length > 0) {
    sendAccountUpdatedEmail({
      email: oldEmail,
      name: employee.name,
      role: 'employee',
      changes,
    }).catch(err => console.error('Failed to send account update email:', err));
  }

  res.status(200).json({
    success: true,
    message: 'Employee updated successfully',
    data: {
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        college: employee.college,
        updatedAt: employee.updatedAt,
      },
    },
  });
});

/**
 * Delete an employee
 * DELETE /api/admin/employees/:id
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the employee first
  const employee = await User.findOne({ _id: id, role: USER_ROLES.EMPLOYEE });
  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  // Store details before deletion
  const employeeEmail = employee.email;
  const employeeName = employee.name;

  // Delete the employee
  await User.findOneAndDelete({ _id: id, role: USER_ROLES.EMPLOYEE });

  // Send email notification
  sendAccountDeletedEmail({
    email: employeeEmail,
    name: employeeName,
    role: 'employee',
  }).catch(err => console.error('Failed to send account deletion email:', err));

  res.status(200).json({
    success: true,
    message: 'Employee deleted successfully',
  });
});

/**
 * Generate comprehensive report for all complaints
 * GET /api/admin/reports
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, predefinedRange } = req.query;

  // Calculate date range
  let dateFilter = {};
  if (predefinedRange === 'last7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    dateFilter = { createdAt: { $gte: sevenDaysAgo } };
  } else if (predefinedRange === 'last30days') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
  } else if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }

  // Get all complaints within date range
  const complaints = await Complaint.find(dateFilter)
    .populate('userId', 'name email college studentId course department role')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });

  // Format data for CSV
  const reportData = complaints.map(complaint => {
    const user = complaint.userId;
    return {
      'Complaint ID': complaint.complaintId || complaint._id.toString(),
      'Submitted By': user.name,
      'Email': user.email,
      'User Type': user.role,
      'Student ID': user.studentId || 'N/A',
      'Department': user.department || 'N/A',
      'College': user.college || 'N/A',
      'Subject': complaint.subject,
      'Content': complaint.content.substring(0, 200) + (complaint.content.length > 200 ? '...' : ''),
      'Status': complaint.status,
      'Submitted At': complaint.createdAt.toISOString(),
      'Resolved At': complaint.resolvedAt ? complaint.resolvedAt.toISOString() : 'N/A',
      'Resolved By': complaint.resolvedBy ? complaint.resolvedBy.name : 'N/A',
      'Acknowledgment': complaint.acknowledgment || 'N/A',
      'Rating': complaint.rating || 'N/A',
      'Acknowledged By Student/Employee': complaint.acknowledgedByStudent ? 'Yes' : 'No',
      'Reopen Count': complaint.reopenHistory.length,
    };
  });

  // Convert to CSV
  const parser = new Parser();
  const csv = parser.parse(reportData);

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=complaints-report-all-${new Date().toISOString().split('T')[0]}.csv`);
  
  res.status(200).send(csv);
});

export default {
  createStudent,
  createStudentsFromCSV,
  getAllStudents,
  updateStudent,
  deleteStudent,
  createSubAdmin,
  createSubAdminsFromCSV,
  getAllSubAdmins,
  updateSubAdmin,
  deleteSubAdmin,
  createEmployee,
  createEmployeesFromCSV,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
  getAllComplaints,
  updateComplaintStatus,
  getStats,
  getStudent,
  generateReport,
};
