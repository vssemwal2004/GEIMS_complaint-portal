import mongoose from 'mongoose';

const EmailConfigSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: [
      'Dean',
      'Medical Superintendent',
      'Deputy Medical Superintendent',
      'Medical Director',
      'Medical Representative',
      'HR Head',
      'HOD'
    ]
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'HOD';
    }
  },
  emails: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for role and department
EmailConfigSchema.index({ role: 1, department: 1 }, { unique: true });

export default mongoose.model('EmailConfig', EmailConfigSchema);
