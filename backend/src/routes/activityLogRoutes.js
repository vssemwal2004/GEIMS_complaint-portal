import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Get all activity logs (paginated)
router.get('/', auth.authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email');

    const total = await ActivityLog.countDocuments();

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
});

// Get single activity log details
router.get('/:id', auth.authenticate, async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!log) {
      return res.status(404).json({ message: 'Activity log not found' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ message: 'Error fetching activity log' });
  }
});

// Download original attendance Excel file or generate summary
router.get('/:id/download', auth.authenticate, async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Activity log not found' });
    }

    // Check if file path exists and file still exists
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;
    
    if (log.filePath && fs.existsSync(log.filePath)) {
      // Send the original file if available
      let cleanFileName = log.fileName || 'attendance.xlsx';
      
      console.log(`📥 Original filename from DB: "${cleanFileName}"`);
      
      // Remove any path components
      cleanFileName = cleanFileName.split(/[/\\]/).pop();
      
      // Aggressively remove ALL trailing underscores and spaces
      // Split into name and extension
      const lastDotIndex = cleanFileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        let namepart = cleanFileName.substring(0, lastDotIndex);
        const extension = cleanFileName.substring(lastDotIndex);
        
        // Remove ALL trailing underscores and spaces using loop
        while (namepart.endsWith('_') || namepart.endsWith(' ')) {
          namepart = namepart.slice(0, -1);
        }
        
        cleanFileName = namepart + extension;
      } else {
        // No extension, just clean the whole name
        while (cleanFileName.endsWith('_') || cleanFileName.endsWith(' ')) {
          cleanFileName = cleanFileName.slice(0, -1);
        }
      }
      
      console.log(`📥 Cleaned filename for download: "${cleanFileName}"`);
      
      // Set headers manually to ensure proper encoding
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}"`);
      
      // Send file
      const fileStream = fs.createReadStream(log.filePath);
      fileStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      });
      
      return fileStream.pipe(res);
    }

    // Fallback: Generate summary Excel from activity log data
    const XLSX = (await import('xlsx')).default;
    
    const excelData = log.emailsSent.map((email, index) => ({
      'S.No': index + 1,
      'Recipient': email.recipient,
      'Recipient Type': email.recipientType,
      'Department': email.department || 'N/A',
      'Record Count': email.recordCount || 0,
      'Status': email.status,
      'Sent At': new Date(email.sentAt).toLocaleString(),
      'Error Message': email.errorMessage || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Email Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Summary_${log.fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading activity log:', error);
    res.status(500).json({ message: 'Error downloading activity log' });
  }
});

// Delete old logs manually (admin only)
router.delete('/cleanup', auth.authenticate, async (req, res) => {
  try {
    await ActivityLog.cleanOldLogs();
    res.json({ success: true, message: 'Old logs cleaned successfully' });
  } catch (error) {
    console.error('Error cleaning logs:', error);
    res.status(500).json({ message: 'Error cleaning logs' });
  }
});

export default router;
