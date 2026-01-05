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

  // Check for duplicate complaint (same content within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const duplicateComplaint = await Complaint.findOne({
    userId,
    content: content.trim(),
    createdAt: { $gte: oneHourAgo }
  });

  if (duplicateComplaint) {
    return res.status(400).json({
      success: false,
      message: 'You have already submitted this complaint recently. Please wait before submitting again.',
    });
  }

  // Check for recent submission (cooldown of 5 minutes between complaints)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentComplaint = await Complaint.findOne({
    userId,
    createdAt: { $gte: fiveMinutesAgo }
  });

  if (recentComplaint) {
    return res.status(400).json({
      success: false,
      message: 'Please wait at least 5 minutes between complaints.',
    });
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
    .populate('resolvedBy', 'name');

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

export default {
  submitComplaint,
  getMyComplaints,
  getComplaint,
  getMyStats,
  getProfile,
};
