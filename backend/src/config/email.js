/**
 * Email Configuration
 * 
 * Uses SMTP for sending emails.
 * Currently configured for Gmail, can easily switch to institutional email.
 * 
 * For Gmail: Use App Password (not regular password)
 * For @gehu.ac.in: Update SMTP_HOST to your mail server
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath, override: true });

let transporter = null;

/**
 * Create SMTP transporter
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn(' SMTP credentials not configured');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs
    },
  });
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>}
 */
const verifyTransporter = async () => {
  try {
    transporter = createTransporter();
    
    if (!transporter) {
      console.log(' SMTP not configured - emails will not be sent');
      return false;
    }

    await transporter.verify();
    console.log(` Email service ready (SMTP: ${process.env.SMTP_HOST || 'smtp.gmail.com'})`);
    return true;
  } catch (error) {
    console.error(' SMTP verification failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('    Check username/password. For Gmail, use App Password.');
    }
    
    transporter = null;
    return false;
  }
};

/**
 * Get the transporter (creates if not exists)
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Wrapper for sendMail that handles errors gracefully
 */
const sendMailWrapper = {
  sendMail: async (options) => {
    const t = getTransporter();
    if (!t) {
      console.warn(' Email not sent - SMTP not configured');
      return { messageId: null };
    }
    
    return t.sendMail(options);
  },
};

export { sendMailWrapper as transporter, verifyTransporter };
export default sendMailWrapper;
