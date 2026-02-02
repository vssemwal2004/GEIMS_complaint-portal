import XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import moment from 'moment';
import EmailConfig from '../models/EmailConfig.js';
import ActivityLog from '../models/ActivityLog.js';

// Validate attendance file structure
const validateFileStructure = (data) => {
  const requiredColumns = [
    'S.No',
    'Attendance id',
    'User Name',
    'Users Designation',
    'Office Locations',
    'Division/Units',
    'Status'
  ];

  if (!data || data.length === 0) {
    throw new Error('File is empty');
  }

  const headers = Object.keys(data[0]);
  const trimmedHeaders = headers.map(h => h.trim());
  
  const missingColumns = requiredColumns.filter(col => {
    return !trimmedHeaders.some(header => 
      header.toLowerCase() === col.toLowerCase()
    );
  });

  if (missingColumns.length > 0) {
    console.log('Available headers:', headers);
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return true;
};

// Parse attendance file
const processAttendanceFile = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath, {
      type: 'file',
      cellDates: false,
      cellFormula: false,
      raw: true  // Always use raw to preserve original values
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    let data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true,  // Always use raw to get original string values
      defval: '',
      blankrows: false
    });
    
    // Clean up formulas in Attendance id column (e.g., ="""09960335 -> 09960335)
    data = data.map(record => {
      if (record['Attendance id']) {
        let aid = String(record['Attendance id']);
        // Remove Excel formula prefix ="""
        aid = aid.replace(/^="+/g, '');  // Remove =" or ="""
        aid = aid.replace(/"+$/g, '');    // Remove trailing quotes
        aid = aid.replace(/"/g, '');      // Remove all remaining quotes
        record['Attendance id'] = aid.trim();
      }
      return record;
    });

    const firstRowKeys = Object.keys(data[0] || {});
    const hasDateLikeHeader = firstRowKeys.some(key => 
      /^\d+\/\d+\/\d+/.test(key)
    );

    if (hasDateLikeHeader) {
      console.log('Detected missing or incorrect headers, attempting to fix...');
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const headers = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? XLSX.utils.format_cell(cell) : `Column${col}`);
      }
      
      console.log('Extracted headers:', headers);
      
      data = XLSX.utils.sheet_to_json(worksheet, { 
        header: headers,
        range: 1,
        raw: false 
      });
    }

    validateFileStructure(data);
    console.log(`Successfully processed ${data.length} records`);
    return data;
  } catch (error) {
    throw new Error(`File processing error: ${error.message}`);
  }
};

// Convert Excel serial number to JavaScript Date
const excelSerialToDate = (serial) => {
  const excelEpoch = new Date(1899, 11, 30);
  const milliseconds = serial * 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + milliseconds);
};

// Create Excel buffer from data
const createExcelBuffer = (data, sheetName = 'Attendance') => {
  const formattedData = data.map(record => {
    // Create new clean record with exact column order
    const newRecord = {
      'S.No': record['S.No'] || '',
      'Attendance id': '',
      'User Name': record['User Name'] || '',
      'Users Designation': record['Users Designation'] || '',
      'Office Locations': record['Office Locations'] || '',
      'Division/Units': record['Division/Units'] || '',
      'In Time': '',
      'Out Time': '',
      'Status': record['Status'] || ''
    };
    
    // Clean Attendance ID (remove any formula remnants and quotes)
    if (record['Attendance id']) {
      let aid = String(record['Attendance id']);
      aid = aid.replace(/^="+/g, '');    // Remove =" or ="""
      aid = aid.replace(/"+$/g, '');     // Remove trailing quotes
      aid = aid.replace(/"/g, '');       // Remove any remaining quotes
      newRecord['Attendance id'] = aid.trim();
    }
    
    // Format In Time
    if (record['In Time']) {
      if (typeof record['In Time'] === 'number') {
        const date = excelSerialToDate(record['In Time']);
        newRecord['In Time'] = moment(date).format('DD-MM-YYYY HH:mm');
      } else {
        const inTimeStr = String(record['In Time']).trim();
        if (inTimeStr) {
          // Check if it's a numeric Excel serial number (as string)
          const numericValue = parseFloat(inTimeStr);
          if (!isNaN(numericValue) && numericValue > 1000 && numericValue < 100000) {
            const date = excelSerialToDate(numericValue);
            newRecord['In Time'] = moment(date).format('DD-MM-YYYY HH:mm');
          } else {
            const parsed = moment(inTimeStr, [
              'DD/MM/YYYY HH:mm:ss',
              'DD/MM/YYYY HH:mm',
              'DD/MM/YYYY',
              'DD-MM-YYYY HH:mm:ss',
              'DD-MM-YYYY HH:mm',
              'DD-MM-YYYY',
              'DD/MM/YY HH:mm:ss',
              'DD/MM/YY HH:mm',
              'DD/MM/YY',
              'DD-MM-YY HH:mm:ss',
              'DD-MM-YY HH:mm',
              'DD-MM-YY',
              'M/D/YYYY H:mm:ss',
              'M/D/YYYY H:mm',
              'M/D/YYYY',
              'M/D/YY H:mm:ss',
              'M/D/YY H:mm',
              'M/D/YY'
            ], true);
            newRecord['In Time'] = parsed.isValid() ? parsed.format('DD-MM-YYYY HH:mm') : inTimeStr;
          }
        }
      }
    }
    
    // Format Out Time
    if (record['Out Time']) {
      if (typeof record['Out Time'] === 'number') {
        const date = excelSerialToDate(record['Out Time']);
        newRecord['Out Time'] = moment(date).format('DD-MM-YYYY HH:mm');
      } else {
        const outTimeStr = String(record['Out Time']).trim();
        if (outTimeStr) {
          // Check if it's a numeric Excel serial number (as string)
          const numericValue = parseFloat(outTimeStr);
          if (!isNaN(numericValue) && numericValue > 1000 && numericValue < 100000) {
            const date = excelSerialToDate(numericValue);
            newRecord['Out Time'] = moment(date).format('DD-MM-YYYY HH:mm');
          } else {
            const parsed = moment(outTimeStr, [
              'DD/MM/YYYY HH:mm:ss',
              'DD/MM/YYYY HH:mm',
              'DD/MM/YYYY',
              'DD-MM-YYYY HH:mm:ss',
              'DD-MM-YYYY HH:mm',
              'DD-MM-YYYY',
              'DD/MM/YY HH:mm:ss',
              'DD/MM/YY HH:mm',
              'DD/MM/YY',
              'DD-MM-YY HH:mm:ss',
              'DD-MM-YY HH:mm',
              'DD-MM-YY',
              'M/D/YYYY H:mm:ss',
              'M/D/YYYY H:mm',
              'M/D/YYYY',
              'M/D/YY H:mm:ss',
              'M/D/YY H:mm',
              'M/D/YY'
            ], true);
            newRecord['Out Time'] = parsed.isValid() ? parsed.format('DD-MM-YYYY HH:mm') : outTimeStr;
          }
        }
      }
    }
    
    return newRecord;
  });
  
  const worksheet = XLSX.utils.json_to_sheet(formattedData, {
    header: ['S.No', 'Attendance id', 'User Name', 'Users Designation', 'Office Locations', 'Division/Units', 'In Time', 'Out Time', 'Status'],
    skipHeader: false
  });
  
  // Set column widths for better formatting
  const colWidths = [
    { wch: 8 },  // S.No
    { wch: 15 }, // Attendance id
    { wch: 25 }, // User Name
    { wch: 25 }, // Users Designation
    { wch: 35 }, // Office Locations
    { wch: 25 }, // Division/Units
    { wch: 18 }, // In Time
    { wch: 18 }, // Out Time
    { wch: 10 }  // Status
  ];
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,
    socketTimeout: 15000
  });
};

// Filter data by date
const filterByDate = (data, targetDate, includeNoInTime = false) => {
  let matchCount = 0;
  const results = data.filter(record => {
    const inTimeValue = record['In Time'];
    const status = (record['Status'] || '').toString().trim().toLowerCase();
    const isLeaveOrAbsent = status.includes('leave') || status === 'l' || status === 'a' || status.includes('absent');
    
    // For Leave/Absent without In Time, include if includeNoInTime is true (current date reports)
    if (!inTimeValue || inTimeValue === '') {
      if (isLeaveOrAbsent && includeNoInTime) {
        matchCount++;
        return true;
      }
      return false;
    }
    
    let inTime;
    
    // Check if it's a number type
    if (typeof inTimeValue === 'number') {
      const jsDate = excelSerialToDate(inTimeValue);
      inTime = moment(jsDate);
    } else {
      const inTimeStr = String(inTimeValue).trim();
      
      // Check if string is actually a numeric Excel serial number
      const numericValue = parseFloat(inTimeStr);
      if (!isNaN(numericValue) && numericValue > 1000 && numericValue < 100000) {
        // This looks like an Excel serial number (e.g., 46055.32341)
        const jsDate = excelSerialToDate(numericValue);
        inTime = moment(jsDate);
      } else {
        // Try string date formats - DD/MM/YYYY formats first to avoid ambiguity with MM/DD/YYYY
        const formats = [
          'DD/MM/YYYY HH:mm:ss',
          'DD/MM/YYYY HH:mm',
          'DD/MM/YYYY',
          'DD-MM-YYYY HH:mm:ss',
          'DD-MM-YYYY HH:mm',
          'DD-MM-YYYY',
          'DD/MM/YY HH:mm:ss',
          'DD/MM/YY HH:mm',
          'DD/MM/YY',
          'DD-MM-YY HH:mm:ss',
          'DD-MM-YY HH:mm',
          'DD-MM-YY',
          'DD/MM/YYYY h:mm:ss A',
          'DD/MM/YYYY h:mm A',
          'DD-MM-YYYY h:mm:ss A',
          'DD-MM-YYYY h:mm A',
          'M/D/YYYY H:mm:ss',
          'M/D/YYYY H:mm',
          'M/D/YYYY',
          'M/D/YY H:mm:ss',
          'M/D/YY H:mm',
          'M/D/YY',
          'M/D/YYYY h:mm:ss A',
          'M/D/YYYY h:mm A',
          'M/D/YY h:mm A'
        ];
        
        for (const format of formats) {
          inTime = moment(inTimeStr, format, true);
          if (inTime.isValid()) {
            break;
          }
        }
        
        // Suppress logging - only log if none of the formats worked and we have data
        // This reduces console spam significantly
      }
    }
    
    const matches = inTime.isValid() && inTime.format('YYYY-MM-DD') === targetDate;
    if (matches) matchCount++;
    
    return matches;
  });
  
  console.log(`Filter matched ${matchCount} records out of ${data.length} total`);
  return results;
};

// CASE 1: Send to Dean (Previous day, all records)
const sendToDean = async (data, transporter) => {
  const config = await EmailConfig.findOne({ role: 'Dean', isActive: true });
  if (!config || config.emails.length === 0) {
    const message = 'No Dean email configuration found';
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const previousDay = moment().subtract(1, 'days').format('YYYY-MM-DD');
  console.log(`  📅 Filtering for previous day: ${previousDay}`);
  const filteredData = filterByDate(data, previousDay, false);  // Don't include Leave/Absent without dates for Dean

  if (filteredData.length === 0) {
    const message = `No data available for previous day (${previousDay})`;
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const excelBuffer = createExcelBuffer(filteredData, 'Dean Report');
  const subject = `Daily Attendance Report – Dean – ${moment(previousDay).format('DD-MM-YYYY')}`;
  
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'GEIMS Attendance';
  
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: config.emails.join(','),
    subject: subject,
    html: `
      <p>Dear Dean,</p>
      <p>Please find attached the daily attendance report for <strong>${moment(previousDay).format('DD-MM-YYYY')}</strong>.</p>
      <p>This report contains attendance records for all staff members.</p>
      <p>Total Records: <strong>${filteredData.length}</strong></p>
      <br>
      <p>Best regards,<br>Attendance Management System</p>
    `,
    attachments: [{
      filename: `Attendance_Dean_${moment(previousDay).format('DD-MM-YYYY')}.xlsx`,
      content: excelBuffer
    }]
  };

  await transporter.sendMail(mailOptions);
  console.log(`  ✓ Email sent to: ${config.emails.join(', ')}`);
  return { sent: true, count: filteredData.length, recipients: config.emails, date: previousDay };
};

// CASE 1B: Send Leave/Absent Report to Dean
const sendLeaveAbsentToDean = async (data, transporter) => {
  const config = await EmailConfig.findOne({ role: 'Dean', isActive: true });
  if (!config || config.emails.length === 0) {
    const message = 'No Dean email configuration found';
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  // Filter only Leave and Absent records
  const leaveAbsentData = data.filter(record => {
    const status = (record['Status'] || '').toString().trim().toLowerCase();
    return status.includes('leave') || status === 'l' || status === 'a' || status.includes('absent');
  });

  if (leaveAbsentData.length === 0) {
    const message = 'No Leave/Absent records found';
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const excelBuffer = createExcelBuffer(leaveAbsentData, 'Leave Absent Report');
  const today = moment().format('DD-MM-YYYY');
  const subject = `Leave & Absent Report – Dean – ${today}`;
  
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'GEIMS Attendance';
  
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: config.emails.join(','),
    subject: subject,
    html: `
      <p>Dear Dean,</p>
      <p>Please find attached the Leave and Absent report for <strong>${today}</strong>.</p>
      <p>This report contains all staff members on Leave or marked Absent.</p>
      <p>Total Records: <strong>${leaveAbsentData.length}</strong></p>
      <br>
      <p>Best regards,<br>Attendance Management System</p>
    `,
    attachments: [{
      filename: `Leave_Absent_Dean_${today}.xlsx`,
      content: excelBuffer
    }]
  };

  await transporter.sendMail(mailOptions);
  console.log(`  ✓ Leave/Absent email sent to: ${config.emails.join(', ')}`);
  return { sent: true, count: leaveAbsentData.length, recipients: config.emails, date: today };
};

// CASE 2: Send to Medical Superintendent & Deputy MS
const sendToMedicalSuperintendent = async (data, transporter) => {
  const msConfig = await EmailConfig.findOne({ role: 'Medical Superintendent', isActive: true });
  const dmsConfig = await EmailConfig.findOne({ role: 'Deputy Medical Superintendent', isActive: true });

  const recipients = [
    ...(msConfig?.emails || []),
    ...(dmsConfig?.emails || [])
  ];

  if (recipients.length === 0) {
    const message = 'No MS/Deputy MS email configuration found';
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const currentDate = moment().format('YYYY-MM-DD');
  let filteredData = filterByDate(data, currentDate, true);
  
  filteredData = filteredData.filter(record => {
    const designation = record['Users Designation']?.toLowerCase() || '';
    return designation.includes('tutor ng') || designation.includes('junior resident ng');
  });

  if (filteredData.length === 0) {
    const message = `No TUTOR NG/Junior Resident NG data for current date`;
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const excelBuffer = createExcelBuffer(filteredData, 'MS Report');
  const subject = `Daily Attendance Report – TUTOR NG & Junior Resident NG – ${moment(currentDate).format('DD-MM-YYYY')}`;
  
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'GEIMS Attendance';
  
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: recipients.join(','),
    subject: subject,
    html: `
      <p>Dear Medical Superintendent / Deputy Medical Superintendent,</p>
      <p>Please find attached the daily attendance report for <strong>${moment(currentDate).format('DD-MM-YYYY')}</strong>.</p>
      <p>This report contains attendance records for TUTOR NG and Junior Resident NG staff.</p>
      <p>Total Records: <strong>${filteredData.length}</strong></p>
      <br>
      <p>Best regards,<br>Attendance Management System</p>
    `,
    attachments: [{
      filename: `Attendance_MS_${moment(currentDate).format('DD-MM-YYYY')}.xlsx`,
      content: excelBuffer
    }]
  };

  await transporter.sendMail(mailOptions);
  console.log(`  ✓ Email sent to: ${recipients.join(', ')}`);
  return { sent: true, count: filteredData.length, recipients, date: currentDate };
};

// CASE 3: Send to Management Team
const sendToManagement = async (data, transporter) => {
  const roles = ['Dean', 'Medical Director', 'Medical Representative', 'Medical Superintendent', 'HR Head'];
  const configs = await EmailConfig.find({ role: { $in: roles }, isActive: true });

  const recipients = configs.reduce((acc, config) => {
    return [...acc, ...config.emails];
  }, []);

  if (recipients.length === 0) {
    const message = 'No management team email configuration found';
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const currentDate = moment().format('YYYY-MM-DD');
  const filteredData = filterByDate(data, currentDate, true);

  if (filteredData.length === 0) {
    const message = `No data available for current date`;
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const excelBuffer = createExcelBuffer(filteredData, 'Management Report');
  const subject = `Daily Attendance Report – Management – ${moment(currentDate).format('DD-MM-YYYY')}`;
  
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'GEIMS Attendance';
  
  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: recipients.join(','),
    subject: subject,
    html: `
      <p>Dear Management Team,</p>
      <p>Please find attached the comprehensive daily attendance report for <strong>${moment(currentDate).format('DD-MM-YYYY')}</strong>.</p>
      <p>This report contains attendance records for all staff members.</p>
      <p>Total Records: <strong>${filteredData.length}</strong></p>
      <br>
      <p>Best regards,<br>Attendance Management System</p>
    `,
    attachments: [{
      filename: `Attendance_Management_${moment(currentDate).format('DD-MM-YYYY')}.xlsx`,
      content: excelBuffer
    }]
  };

  await transporter.sendMail(mailOptions);
  console.log(`  ✓ Email sent to: ${recipients.join(', ')}`);
  return { sent: true, count: filteredData.length, recipients, date: currentDate };
};

// CASE 4: Send to HODs (Department-wise)
const sendToHODs = async (data, transporter) => {
  const hodConfigs = await EmailConfig.find({ role: 'HOD', isActive: true });

  if (hodConfigs.length === 0) {
    const message = 'No HOD email configuration found';
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  const currentDate = moment().format('YYYY-MM-DD');
  const results = [];

  for (const config of hodConfigs) {
    const department = config.department;
    
    let filteredData = filterByDate(data, currentDate, true);
    filteredData = filteredData.filter(record => {
      const recordDept = (record['Division/Units'] || '').trim();
      return recordDept.toLowerCase() === department.toLowerCase();
    });

    if (filteredData.length === 0) {
      console.log(`    ⚠ No data for department: ${department}`);
      continue;
    }

    const excelBuffer = createExcelBuffer(filteredData, department);
    const subject = `Daily Attendance Report – ${department} – ${moment(currentDate).format('DD-MM-YYYY')}`;
    
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'GEIMS Attendance';
    
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: config.emails.join(','),
      subject: subject,
      html: `
        <p>Dear HOD - ${department},</p>
        <p>Please find attached the daily attendance report for your department for <strong>${moment(currentDate).format('DD-MM-YYYY')}</strong>.</p>
        <p>Department: <strong>${department}</strong></p>
        <p>Total Records: <strong>${filteredData.length}</strong></p>
        <br>
        <p>Best regards,<br>Attendance Management System</p>
      `,
      attachments: [{
        filename: `Attendance_${department.replace(/[^a-z0-9]/gi, '_')}_${moment(currentDate).format('DD-MM-YYYY')}.xlsx`,
        content: excelBuffer
      }]
    };

    await transporter.sendMail(mailOptions);
    console.log(`    ✓ Email sent to: ${config.emails.join(', ')}`);
    
    results.push({ 
      department, 
      sent: true, 
      count: filteredData.length, 
      recipients: config.emails 
    });
  }

  if (results.length === 0) {
    const message = `No HOD data found for current date`;
    console.log(`  ⚠ ${message}`);
    return { sent: false, reason: message, skipped: true };
  }

  return { sent: true, departments: results, totalDepartments: results.length, date: currentDate };
};

// Main function to send all reports
const sendReports = async (filePath, userId, fileName, keepFile = false) => {
  let activityLog = {
    fileName: fileName || 'attendance-file.xlsx',
    filePath: keepFile ? filePath : undefined,
    totalRecords: 0,
    emailsSent: [],
    uploadedBy: userId,
    overallStatus: 'completed'
  };

  try {
    const data = await processAttendanceFile(filePath);
    console.log(`\nStarting email dispatch workflow - Total records: ${data.length}\n`);
    
    activityLog.totalRecords = data.length;
    
    const transporter = createTransporter();
    const results = { workflow: 'SEQUENTIAL', conditions: [] };
    let hasAnyFailure = false;

    // CONDITION 1: Dean Report
    console.log('--- EXECUTING CONDITION 1: Dean (Previous Day - All) ---');
    try {
      const result1 = await sendToDean(data, transporter);
      results.conditions.push({ condition: 1, name: 'Dean Report', status: 'COMPLETED', result: result1 });
      
      if (result1.sent) {
        result1.recipients.forEach(email => {
          activityLog.emailsSent.push({
            recipient: email,
            recipientType: 'Dean',
            recordCount: result1.count,
            status: 'success'
          });
        });
      }
      console.log('✓ CONDITION 1 COMPLETED\n');
    } catch (error) {
      results.conditions.push({ condition: 1, name: 'Dean Report', status: 'FAILED', error: error.message });
      activityLog.emailsSent.push({
        recipient: 'Dean',
        recipientType: 'Dean',
        status: 'failed',
        errorMessage: error.message
      });
      console.log(`✗ CONDITION 1 FAILED: ${error.message}\n`);
      hasAnyFailure = true;
    }

    // CONDITION 1B: Dean Leave/Absent Report
    console.log('--- EXECUTING CONDITION 1B: Dean (Leave & Absent) ---');
    try {
      const result1b = await sendLeaveAbsentToDean(data, transporter);
      results.conditions.push({ condition: '1B', name: 'Dean Leave/Absent Report', status: 'COMPLETED', result: result1b });
      
      if (result1b.sent) {
        result1b.recipients.forEach(email => {
          activityLog.emailsSent.push({
            recipient: email,
            recipientType: 'Dean',
            recordCount: result1b.count,
            status: 'success'
          });
        });
      }
      console.log('✓ CONDITION 1B COMPLETED\n');
    } catch (error) {
      results.conditions.push({ condition: '1B', name: 'Dean Leave/Absent Report', status: 'FAILED', error: error.message });
      activityLog.emailsSent.push({
        recipient: 'Dean (Leave/Absent)',
        recipientType: 'Dean',
        status: 'failed',
        errorMessage: error.message
      });
      console.log(`✗ CONDITION 1B FAILED: ${error.message}\n`);
      hasAnyFailure = true;
    }

    // CONDITION 2: MS/Deputy MS Report
    console.log('--- EXECUTING CONDITION 2: MS/Deputy MS (Current Day - Tutors) ---');
    try {
      const result2 = await sendToMedicalSuperintendent(data, transporter);
      results.conditions.push({ condition: 2, name: 'MS/Deputy MS Report', status: 'COMPLETED', result: result2 });
      
      if (result2.sent) {
        result2.recipients.forEach(email => {
          activityLog.emailsSent.push({
            recipient: email,
            recipientType: 'MS/Deputy MS',
            recordCount: result2.count,
            status: 'success'
          });
        });
      }
      console.log('✓ CONDITION 2 COMPLETED\n');
    } catch (error) {
      results.conditions.push({ condition: 2, name: 'MS/Deputy MS Report', status: 'FAILED', error: error.message });
      activityLog.emailsSent.push({
        recipient: 'MS/Deputy MS',
        recipientType: 'MS/Deputy MS',
        status: 'failed',
        errorMessage: error.message
      });
      console.log(`✗ CONDITION 2 FAILED: ${error.message}\n`);
      hasAnyFailure = true;
    }

    // CONDITION 3: Management Team
    console.log('--- EXECUTING CONDITION 3: Management Team (Current Day - All) ---');
    try {
      const result3 = await sendToManagement(data, transporter);
      results.conditions.push({ condition: 3, name: 'Management Report', status: 'COMPLETED', result: result3 });
      
      if (result3.sent) {
        result3.recipients.forEach(email => {
          activityLog.emailsSent.push({
            recipient: email,
            recipientType: 'Management Team',
            recordCount: result3.count,
            status: 'success'
          });
        });
      }
      console.log('✓ CONDITION 3 COMPLETED\n');
    } catch (error) {
      results.conditions.push({ condition: 3, name: 'Management Report', status: 'FAILED', error: error.message });
      activityLog.emailsSent.push({
        recipient: 'Management Team',
        recipientType: 'Management Team',
        status: 'failed',
        errorMessage: error.message
      });
      console.log(`✗ CONDITION 3 FAILED: ${error.message}\n`);
      hasAnyFailure = true;
    }

    // CONDITION 4: HODs
    console.log('--- EXECUTING CONDITION 4: HODs (Current Day - By Department) ---');
    try {
      const result4 = await sendToHODs(data, transporter);
      results.conditions.push({ condition: 4, name: 'HOD Reports', status: 'COMPLETED', result: result4 });
      
      if (result4.sent && result4.departments) {
        result4.departments.forEach(dept => {
          dept.recipients.forEach(email => {
            activityLog.emailsSent.push({
              recipient: email,
              recipientType: 'HOD',
              department: dept.department,
              recordCount: dept.count,
              status: 'success'
            });
          });
        });
      }
      console.log('✓ CONDITION 4 COMPLETED\n');
    } catch (error) {
      results.conditions.push({ condition: 4, name: 'HOD Reports', status: 'FAILED', error: error.message });
      activityLog.emailsSent.push({
        recipient: 'HODs',
        recipientType: 'HOD',
        status: 'failed',
        errorMessage: error.message
      });
      console.log(`✗ CONDITION 4 FAILED: ${error.message}\n`);
      hasAnyFailure = true;
    }

    // Determine overall status
    const successfulEmails = activityLog.emailsSent.filter(e => e.status === 'success').length;
    const failedEmails = activityLog.emailsSent.filter(e => e.status === 'failed').length;
    
    if (failedEmails > 0 && successfulEmails > 0) {
      activityLog.overallStatus = 'partial';
    } else if (failedEmails > 0 && successfulEmails === 0) {
      activityLog.overallStatus = 'failed';
    } else {
      activityLog.overallStatus = 'completed';
    }

    console.log('========== WORKFLOW COMPLETED ==========\n');
    results.overallStatus = hasAnyFailure ? 'PARTIAL_SUCCESS' : 'ALL_CONDITIONS_COMPLETED';
    
    // Save activity log
    await ActivityLog.create(activityLog);
    await ActivityLog.cleanOldLogs();
    
    return results;
  } catch (error) {
    console.error('Error in workflow execution:', error);
    
    // Save failed activity log
    activityLog.overallStatus = 'failed';
    activityLog.emailsSent.push({
      recipient: 'All',
      recipientType: 'System',
      status: 'failed',
      errorMessage: error.message
    });
    
    await ActivityLog.create(activityLog);
    await ActivityLog.cleanOldLogs();
    
    throw error;
  }
};

export { processAttendanceFile, sendReports, createExcelBuffer };
