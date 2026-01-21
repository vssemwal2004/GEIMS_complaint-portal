import express from 'express';
import uploadAttendance from '../middlewares/uploadAttendance.js';
import auth from '../middlewares/auth.js';
import { processAttendanceFile, sendReports } from '../services/attendanceService.js';
import fs from 'fs';

const router = express.Router();

// Upload and process attendance file
router.post('/upload', auth.authenticate, uploadAttendance.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const attendanceData = await processAttendanceFile(req.file.path);
    
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: 'File processed successfully',
      recordCount: attendanceData.length
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('File upload error:', error);
    res.status(500).json({ 
      message: 'Error processing file', 
      error: error.message 
    });
  }
});

// Send attendance reports
router.post('/send-reports', auth.authenticate, uploadAttendance.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Clean filename - remove trailing underscores and spaces properly
    let cleanFileName = req.file.originalname || 'attendance.xlsx';
    
    // Split by extension
    const lastDotIndex = cleanFileName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      let namepart = cleanFileName.substring(0, lastDotIndex);
      const extension = cleanFileName.substring(lastDotIndex);
      // Clean the name part
      namepart = namepart.trim().replace(/[_\s]+$/, '');
      cleanFileName = namepart + extension;
    } else {
      cleanFileName = cleanFileName.trim().replace(/[_\s]+$/, '');
    }
    
    console.log(`📤 Processing file: ${req.file.originalname} -> ${cleanFileName}`);

    const result = await sendReports(req.file.path, req.userId, cleanFileName, true);
    
    // Don't delete the file immediately - keep it for download from activity log
    // It will be deleted after 48 hours via cleanup

    res.json({ 
      success: true, 
      message: 'Reports sent successfully',
      details: result
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Send reports error:', error);
    res.status(500).json({ 
      message: 'Error sending reports', 
      error: error.message 
    });
  }
});

export default router;
