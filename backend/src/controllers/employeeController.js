/**
 * Employee Controller
 * 
 * Handles employee-specific operations including complaint submission and management.
 * Employees have similar functionality to students but with department instead of course.
 * 
 * Security Considerations:
 * - Employee-only access (enforced by middleware)
 * - Employees can only manage their own complaints
 * - Input validation for all operations
 */

import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middlewares/errorHandler.js';

/**
 * Submit a new complaint
 * POST /api/employee/complaints
 */
export const submitComplaint = asyncHandler(async (req, res) => {
  const { subject, content, imageUrl } = req.body;
  const userId = req.userId;

  // Check daily complaint limit (e.g., max 3 complaints per day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayComplaints = await Complaint.countDocuments({
    userId,
    createdAt: { $gte: today },
  });

  const DAILY_LIMIT = 3;
  if (todayComplaints >= DAILY_LIMIT) {
    throw new ValidationError(`You have reached the daily complaint limit of ${DAILY_LIMIT}`);
  }

  // Create complaint
  const complaint = new Complaint({
    userId,
    subject,
    content,
    imageUrl: imageUrl || null,
    status: COMPLAINT_STATUS.READ,
  });

  await complaint.save();

  // Populate user details for response
  await complaint.populate('userId', 'name email department college');

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: {
      complaint,
    },
  });
});

/**
 * Get employee's own complaints
 * GET /api/employee/complaints
 */
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.userId;

  // Build query
  const query = { userId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const total = await Complaint.countDocuments(query);
  const complaints = await Complaint.find(query)
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
 * Get single complaint details
 * GET /api/employee/complaints/:id
 */
export const getComplaintById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const complaint = await Complaint.findOne({ _id: id, userId })
    .populate('userId', 'name email department college')
    .populate('resolvedBy', 'name email')
    .populate('reopenHistory.reopenedBy', 'name email');

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  res.status(200).json({
    success: true,
    data: {
      complaint,
    },
  });
});

/**
 * Reopen a resolved complaint
 * POST /api/employee/complaints/:id/reopen
 */
export const reopenComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reopenRemarks } = req.body;
  const userId = req.userId;

  const complaint = await Complaint.findOne({ _id: id, userId });

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  // Can only reopen resolved complaints
  if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
    throw new ValidationError('Only resolved complaints can be reopened');
  }

  // Add to reopen history
  complaint.reopenHistory.push({
    reopenedBy: userId,
    reopenedAt: new Date(),
    reopenRemarks,
    previousStatus: complaint.status,
  });

  // Reset status to READ
  complaint.status = COMPLAINT_STATUS.READ;
  complaint.resolvedAt = null;
  complaint.resolvedBy = null;
  complaint.acknowledgedByStudent = false;
  complaint.acknowledgedAt = null;

  await complaint.save();

  // Populate for response
  await complaint.populate('userId', 'name email department college');
  await complaint.populate('resolvedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Complaint reopened successfully',
    data: {
      complaint,
    },
  });
});

/**
 * Rate a resolved complaint
 * POST /api/employee/complaints/:id/rate
 */
export const rateComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.userId;

  const complaint = await Complaint.findOne({ _id: id, userId });

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  // Can only rate resolved complaints
  if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
    throw new ValidationError('Only resolved complaints can be rated');
  }

  // Update rating
  complaint.rating = rating;
  await complaint.save();

  res.status(200).json({
    success: true,
    message: 'Rating submitted successfully',
    data: {
      complaint,
    },
  });
});

/**
 * Acknowledge a resolved complaint
 * POST /api/employee/complaints/:id/acknowledge
 */
export const acknowledgeComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acknowledged } = req.body;
  const userId = req.userId;

  const complaint = await Complaint.findOne({ _id: id, userId });

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  // Can only acknowledge resolved complaints
  if (complaint.status !== COMPLAINT_STATUS.RESOLVED) {
    throw new ValidationError('Only resolved complaints can be acknowledged');
  }

  // Update acknowledgment
  complaint.acknowledgedByStudent = acknowledged;
  if (acknowledged) {
    complaint.acknowledgedAt = new Date();
  }
  await complaint.save();

  res.status(200).json({
    success: true,
    message: acknowledged ? 'Complaint acknowledged successfully' : 'Acknowledgment removed',
    data: {
      complaint,
    },
  });
});

/**
 * Get employee dashboard statistics
 * GET /api/employee/dashboard
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const [
    totalComplaints,
    readComplaints,
    underReviewComplaints,
    resolvedComplaints,
    recentComplaints,
  ] = await Promise.all([
    Complaint.countDocuments({ userId }),
    Complaint.countDocuments({ userId, status: COMPLAINT_STATUS.READ }),
    Complaint.countDocuments({ userId, status: COMPLAINT_STATUS.UNDER_REVIEW }),
    Complaint.countDocuments({ userId, status: COMPLAINT_STATUS.RESOLVED }),
    Complaint.find({ userId })
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        total: totalComplaints,
        byStatus: {
          read: readComplaints,
          underReview: underReviewComplaints,
          resolved: resolvedComplaints,
        },
      },
      recentComplaints,
    },
  });
});

export default {
  submitComplaint,
  getMyComplaints,
  getComplaintById,
  reopenComplaint,
  rateComplaint,
  acknowledgeComplaint,
  getDashboardStats,
};
