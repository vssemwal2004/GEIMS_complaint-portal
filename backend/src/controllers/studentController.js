/**
 * Student Controller
 * 
 * Handles student-specific operations including complaint submission
 * and viewing complaint status.
 * 
 * Security Considerations:
 * - Student-only access (enforced by middleware)
 * - Input validation for complaints
 * - File upload validation
 * - Users can only access their own complaints
 */

import Complaint, { COMPLAINT_STATUS } from '../models/Complaint.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middlewares/errorHandler.js';
import { getFileUrl } from '../middlewares/upload.js';

/**
 * Submit a new complaint
 * POST /api/student/complaints
 */
export const submitComplaint = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.userId;

  // Create complaint object
  const complaintData = {
    userId,
    content,
    status: COMPLAINT_STATUS.READ, // Initial status
  };

  // Add image URL if file was uploaded
  if (req.file) {
    complaintData.imageUrl = getFileUrl(req.file.filename);
  }

  const complaint = new Complaint(complaintData);
  await complaint.save();

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    data: {
      complaint: {
        id: complaint._id,
        content: complaint.content,
        imageUrl: complaint.imageUrl,
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
