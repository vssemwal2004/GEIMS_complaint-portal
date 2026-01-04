/**
 * Complaint Model
 * 
 * Defines the schema for complaints/feedback/reviews submitted by students.
 * Includes status tracking, admin acknowledgment, and image attachments.
 * 
 * Security Considerations:
 * - Content length validation to prevent abuse
 * - Status values strictly enumerated
 * - User reference ensures data integrity
 * - Image URL sanitization
 */

import mongoose from 'mongoose';

// Define complaint statuses as constants
export const COMPLAINT_STATUS = {
  READ: 'READ',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
};

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true, // Index for faster user-based queries
    },
    content: {
      type: String,
      required: [true, 'Complaint content is required'],
      trim: true,
      // Content validation will be done at application level for word count
      // This is a basic character limit for database safety
      maxlength: [50000, 'Content cannot exceed 50000 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
      // Basic URL validation
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          // Allow relative paths starting with /uploads/ or full URLs
          return v.startsWith('/uploads/') || /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid image URL format',
      },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(COMPLAINT_STATUS),
        message: 'Status must be READ, UNDER_REVIEW, or RESOLVED',
      },
      default: COMPLAINT_STATUS.READ,
      index: true, // Index for filtering by status
    },
    acknowledgment: {
      type: String,
      trim: true,
      maxlength: [5000, 'Acknowledgment cannot exceed 5000 characters'],
      default: null,
      // Acknowledgment is only set when status is RESOLVED
      validate: {
        validator: function (v) {
          // If status is RESOLVED, acknowledgment should be present
          if (this.status === COMPLAINT_STATUS.RESOLVED && !v) {
            return false;
          }
          return true;
        },
        message: 'Acknowledgment is required when status is RESOLVED',
      },
    },
    // Track who resolved the complaint
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for efficient queries
complaintSchema.index({ userId: 1, status: 1 });
complaintSchema.index({ createdAt: -1 }); // For sorting by newest first

/**
 * Pre-save middleware to set resolvedAt when status changes to RESOLVED
 */
complaintSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === COMPLAINT_STATUS.RESOLVED) {
    this.resolvedAt = new Date();
  }
  next();
});

/**
 * Static method to get complaints by user
 * @param {string} userId
 * @returns {Promise<Complaint[]>}
 */
complaintSchema.statics.findByUserId = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Static method to get all complaints (for admin)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Complaint[]>}
 */
complaintSchema.statics.findAllWithUser = function (filters = {}) {
  return this.find(filters)
    .populate('userId', 'name email college')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });
};

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
