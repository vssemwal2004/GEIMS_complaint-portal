import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  totalRecords: {
    type: Number,
    required: true
  },
  emailsSent: [{
    recipient: {
      type: String,
      required: true
    },
    recipientType: {
      type: String,
      enum: ['Dean', 'MS/Deputy MS', 'Management Team', 'HOD', 'System'],
      required: true
    },
    department: String, // Only for HOD
    recordCount: Number,
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'skipped'],
      default: 'success'
    },
    errorMessage: String
  }],
  overallStatus: {
    type: String,
    enum: ['completed', 'partial', 'failed'],
    default: 'completed'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
ActivityLogSchema.index({ uploadDate: -1 });
ActivityLogSchema.index({ uploadedBy: 1 });

// Delete logs older than 48 hours to save space
ActivityLogSchema.statics.cleanOldLogs = async function() {
  const fs = (await import('fs')).default;
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  // Find old logs first to delete their files
  const oldLogs = await this.find({ uploadDate: { $lt: fortyEightHoursAgo } });
  
  // Delete associated files
  for (const log of oldLogs) {
    if (log.filePath && fs.existsSync(log.filePath)) {
      try {
        fs.unlinkSync(log.filePath);
        console.log(`🗑️  Deleted file: ${log.filePath}`);
      } catch (err) {
        console.error(`Error deleting file ${log.filePath}:`, err);
      }
    }
  }
  
  // Delete the logs from database
  const result = await this.deleteMany({ uploadDate: { $lt: fortyEightHoursAgo } });
  if (result.deletedCount > 0) {
    console.log(`🗑️  Deleted ${result.deletedCount} activity logs older than 48 hours`);
  }
  return result;
};

export default mongoose.model('ActivityLog', ActivityLogSchema);
