/**
 * Sub-Admin Controller
 * 
 * Handles sub-admin-specific operations including complaint management
 * for their department only.
 * 
 * Security Considerations:
 * - Sub-admin can only see complaints from students in their department (course-based)
 * - Sub-admin can only see complaints from employees in their department
 * - Sub-admin access enforced by middleware and query filters
 */

import User, { USER_ROLES } from '../models/User.js';
import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import { sendComplaintResolvedEmail, sendStatusUpdateEmail } from '../services/emailService.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middlewares/errorHandler.js';
import { Parser } from 'json2csv';

/**
 * Get complaints for sub-admin's department
 * GET /api/sub-admin/complaints
 */
export const getComplaintsForDepartment = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const subAdmin = await User.findById(req.userId);

  if (!subAdmin || !subAdmin.department) {
    throw new ValidationError('Sub-admin department not found');
  }

  // Create case-insensitive regex for department matching
  const departmentRegex = new RegExp(`^${subAdmin.department}$`, 'i');

  // Get students whose department matches sub-admin's department (case-insensitive)
  const studentsInDepartment = await User.find({
    role: USER_ROLES.STUDENT,
    department: departmentRegex,
  }).select('_id');

  // Get employees in sub-admin's department (case-insensitive)
  const employeesInDepartment = await User.find({
    role: USER_ROLES.EMPLOYEE,
    department: departmentRegex,
  }).select('_id');

  // Combine user IDs
  const userIds = [
    ...studentsInDepartment.map(s => s._id),
    ...employeesInDepartment.map(e => e._id),
  ];

  // Build query
  const query = { userId: { $in: userIds } };
  if (status && status !== 'all') {
    query.status = status;
  }

  const total = await Complaint.countDocuments(query);
  const complaints = await Complaint.find(query)
    .populate('userId', 'name email college studentId course department role')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 })
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
 * Update complaint status (sub-admin)
 * PATCH /api/sub-admin/complaints/:id/status
 */
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, acknowledgment } = req.body;
  const subAdmin = await User.findById(req.userId);

  if (!subAdmin || !subAdmin.department) {
    throw new ValidationError('Sub-admin department not found');
  }

  // Find complaint with user details
  const complaint = await Complaint.findById(id).populate('userId', 'name email studentId department role college');

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  // Verify sub-admin has access to this complaint (case-insensitive department match)
  const user = complaint.userId;
  const departmentRegex = new RegExp(`^${subAdmin.department}$`, 'i');
  const hasAccess =
    (user.role === USER_ROLES.STUDENT && departmentRegex.test(user.department)) ||
    (user.role === USER_ROLES.EMPLOYEE && departmentRegex.test(user.department));

  if (!hasAccess) {
    throw new ValidationError('You do not have access to this complaint');
  }

  // Cannot update if already resolved
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

  // Send email notification
  if (status === COMPLAINT_STATUS.RESOLVED) {
    sendComplaintResolvedEmail({
      email: user.email,
      name: user.name,
      complaintId: complaint.complaintId || complaint._id.toString(),
      subject: complaint.subject,
      content: complaint.content,
      acknowledgment,
      submittedAt: complaint.createdAt,
    }).catch(err => console.error('Failed to send resolution email:', err));
  } else {
    sendStatusUpdateEmail({
      email: user.email,
      name: user.name,
      complaintId: complaint.complaintId || complaint._id.toString(),
      subject: complaint.subject,
      status,
    }).catch(err => console.error('Failed to send status update email:', err));
  }

  // Fetch updated complaint with populated fields
  const updatedComplaint = await Complaint.findById(id)
    .populate('userId', 'name email college studentId course department role')
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
 * Get statistics for sub-admin's department
 * GET /api/sub-admin/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const subAdmin = await User.findById(req.userId);

  if (!subAdmin || !subAdmin.department) {
    throw new ValidationError('Sub-admin department not found');
  }

  // Create case-insensitive regex for department matching
  const departmentRegex = new RegExp(`^${subAdmin.department}$`, 'i');

  // Get students and employees in department (case-insensitive)
  const [studentsInDepartment, employeesInDepartment] = await Promise.all([
    User.find({ role: USER_ROLES.STUDENT, department: departmentRegex }).select('_id'),
    User.find({ role: USER_ROLES.EMPLOYEE, department: departmentRegex }).select('_id'),
  ]);

  const userIds = [
    ...studentsInDepartment.map(s => s._id),
    ...employeesInDepartment.map(e => e._id),
  ];

  const [
    totalComplaints,
    readComplaints,
    underReviewComplaints,
    resolvedComplaints,
  ] = await Promise.all([
    Complaint.countDocuments({ userId: { $in: userIds } }),
    Complaint.countDocuments({ userId: { $in: userIds }, status: COMPLAINT_STATUS.READ }),
    Complaint.countDocuments({ userId: { $in: userIds }, status: COMPLAINT_STATUS.UNDER_REVIEW }),
    Complaint.countDocuments({ userId: { $in: userIds }, status: COMPLAINT_STATUS.RESOLVED }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        department: subAdmin.department,
        totalStudents: studentsInDepartment.length,
        totalEmployees: employeesInDepartment.length,
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
 * Generate report for sub-admin's department
 * GET /api/sub-admin/reports
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, predefinedRange } = req.query;
  const subAdmin = await User.findById(req.userId);

  if (!subAdmin || !subAdmin.department) {
    throw new ValidationError('Sub-admin department not found');
  }

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

  // Create case-insensitive regex for department matching
  const departmentRegex = new RegExp(`^${subAdmin.department}$`, 'i');

  // Get users in department
  const [studentsInDepartment, employeesInDepartment] = await Promise.all([
    User.find({ role: USER_ROLES.STUDENT, department: departmentRegex }).select('_id'),
    User.find({ role: USER_ROLES.EMPLOYEE, department: departmentRegex }).select('_id'),
  ]);

  const userIds = [
    ...studentsInDepartment.map(s => s._id),
    ...employeesInDepartment.map(e => e._id),
  ];

  // Get complaints
  const complaints = await Complaint.find({
    userId: { $in: userIds },
    ...dateFilter,
  })
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
      'Acknowledged By Student': complaint.acknowledgedByStudent ? 'Yes' : 'No',
      'Reopen Count': complaint.reopenHistory.length,
    };
  });

  // Convert to CSV
  const parser = new Parser();
  const csv = parser.parse(reportData);

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=complaints-report-${subAdmin.department}-${new Date().toISOString().split('T')[0]}.csv`);
  
  res.status(200).send(csv);
});

/**
 * Get students for sub-admin's department
 * GET /api/sub-admin/students
 */
export const getStudentsForDepartment = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const subAdmin = await User.findById(req.userId);

  if (!subAdmin || !subAdmin.department) {
    console.error('Sub-admin not found or has no department:', req.userId);
    throw new ValidationError('Sub-admin department not found');
  }

  console.log(`Sub-admin ${subAdmin.name} (${subAdmin.department}) requesting students`);

  // Build query - students whose department matches sub-admin's department (case-insensitive)
  const query = {
    role: USER_ROLES.STUDENT,
    department: { $regex: new RegExp(`^${subAdmin.department}$`, 'i') }, // Case-insensitive match
  };

  // Add search filter if provided
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ];
  }

  // Get total count
  const total = await User.countDocuments(query);

  // Get students with pagination
  const students = await User.find(query)
    .select('name email studentId department college createdAt isActive')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  console.log(`Sub-admin ${subAdmin.department} fetching students. Found: ${students.length} out of ${total}`);

  res.json({
    success: true,
    data: {
      students,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    },
  });
});

/**
 * Get employees for sub-admin's department
 * GET /api/sub-admin/employees
 */
export const getEmployeesForDepartment = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const subAdmin = await User.findById(req.userId);

  if (!subAdmin || !subAdmin.department) {
    throw new ValidationError('Sub-admin department not found');
  }

  // Build query - employees whose department matches sub-admin's department (case-insensitive)
  const query = {
    role: USER_ROLES.EMPLOYEE,
    department: { $regex: new RegExp(`^${subAdmin.department}$`, 'i') },
  };

  // Add search filter if provided
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
    ];
  }

  // Get employees
  const employees = await User.find(query)
    .select('name email department college createdAt isActive')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      employees,
    },
  });
});

export default {
  getComplaintsForDepartment,
  updateComplaintStatus,
  getStats,
  generateReport,
  getStudentsForDepartment,
  getEmployeesForDepartment,
};
