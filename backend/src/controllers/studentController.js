/**
 * Student Controller
 * 
 * Handles student-specific operations including complaint submission
 * and viewing complaint status.
 * 
 * Security Considerations:
 * - Student-only access (enforced by middleware)
 * - Input validation for complaints
 * - Users can only access their own complaints
 */

import mongoose from 'mongoose';
import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import User from '../models/User.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middlewares/errorHandler.js';
import { sendComplaintSubmittedEmail } from '../services/emailService.js';

/**
 * Submit a new complaint
 * POST /api/student/complaints
 * 
 * Security:
 * - Rate limited to 5 complaints per day
 * - Content moderation in validation
 * - Duplicate detection (same content within 1 hour)
 */
export const submitComplaint = asyncHandler(async (req, res) => {
  const { subject, content } = req.body;
  const userId = req.userId;
  const trimmedContent = content.trim();

  // Single optimized query to check all limits at once
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Use aggregation to get all checks in ONE database query
  const [checks] = await Complaint.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startOfDay }
      }
    },
    {
      $group: {
        _id: null,
        dailyCount: { $sum: 1 },
        hasRecentComplaint: {
          $sum: { $cond: [{ $gte: ['$createdAt', fiveMinutesAgo] }, 1, 0] }
        },
        hasDuplicateContent: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $gte: ['$createdAt', oneHourAgo] },
                  { $eq: ['$content', trimmedContent] }
                ]
              },
              1, 
              0
            ]
          }
        }
      }
    }
  ]);

  // Check results (checks will be undefined if no complaints today)
  if (checks) {
    if (checks.dailyCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'You have reached your daily complaint limit (5 per day). Please try again tomorrow.',
      });
    }

    if (checks.hasRecentComplaint > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please wait at least 5 minutes between complaints.',
      });
    }

    if (checks.hasDuplicateContent > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this complaint recently. Please wait before submitting again.',
      });
    }
  }

  // Get user details for email
  const user = await User.findById(userId);

  // Create complaint object
  const complaintData = {
    userId,
    subject,
    content,
    status: COMPLAINT_STATUS.READ, // Initial status
  };

  const complaint = new Complaint(complaintData);
  await complaint.save();

  // Send email notification (non-blocking)
  if (user && user.email) {
    sendComplaintSubmittedEmail({
      email: user.email,
      name: user.name,
      complaintId: complaint.complaintId,
      subject: complaint.subject,
      content: complaint.content,
    }).catch(err => console.error('Failed to send complaint email:', err.message));
  }

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: {
      complaint: {
        id: complaint._id,
        complaintId: complaint.complaintId,
        subject: complaint.subject,
        content: complaint.content,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
    },
  });
});

/**
 * Get all complaints for the logged-in student
 * GET /api/student/complaints
 */
export const getMyComplaints = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10, status } = req.query;

  const query = { userId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const total = await Complaint.countDocuments(query);
  const complaints = await Complaint.find(query)
    .populate('resolvedBy', 'name')
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
 * Get a single complaint by ID
 * GET /api/student/complaints/:id
 */
export const getComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const complaint = await Complaint.findOne({ _id: id, userId })
    .populate('resolvedBy', 'name')
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
 * Get complaint statistics for the logged-in student
 * GET /api/student/stats
 */
export const getMyStats = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const [
    totalComplaints,
    readComplaints,
    underReviewComplaints,
    resolvedComplaints,
  ] = await Promise.all([
    Complaint.countDocuments({ userId }),
    Complaint.countDocuments({ userId, status: COMPLAINT_STATUS.READ }),
    Complaint.countDocuments({ userId, status: COMPLAINT_STATUS.UNDER_REVIEW }),
    Complaint.countDocuments({ userId, status: COMPLAINT_STATUS.RESOLVED }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
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
 * Get student profile
 * GET /api/student/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    },
  });
});

/**
 * Reopen a resolved complaint
 * POST /api/student/complaints/:id/reopen
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
  await complaint.populate('userId', 'name email college studentId');
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
 * POST /api/student/complaints/:id/rate
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
 * POST /api/student/complaints/:id/acknowledge
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

export default {
  submitComplaint,
  getMyComplaints,
  getComplaint,
  getMyStats,
  getProfile,
  reopenComplaint,
  rateComplaint,
  acknowledgeComplaint,
};
