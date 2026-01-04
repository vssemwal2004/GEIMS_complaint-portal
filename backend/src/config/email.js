/**
 * Email Configuration
 * 
 * Configures Nodemailer transporter for sending emails via SMTP.
 * All credentials are loaded from environment variables.
 * 
 * Security Considerations:
 * - No hardcoded SMTP credentials
 * - TLS/SSL encryption support
 * - Connection verification on startup
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded here as well so SMTP_* values
// are correct even if this module is imported before
// the main server entry runs dotenv.config().
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// backend/src/config -> go up twice to reach backend/.env
const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath, override: true });

/**
 * Create and configure email transporter
 * @returns {nodemailer.Transporter}
 */
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Increased timeouts for cloud environments like Render
    connectionTimeout: 60000,  // 60 seconds
    greetingTimeout: 30000,    // 30 seconds
    socketTimeout: 60000,      // 60 seconds
    // TLS options for better compatibility
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
  });

  return transporter;
};

/**
 * Verify email transporter connection
 *
 * If no transporter instance is provided, use the default
 * transporter created in this module.
 *
 * @param {nodemailer.Transporter} transporterInstance
 * @returns {Promise<boolean>}
 */
const verifyTransporter = async (transporterInstance = transporter) => {
  try {
    await transporterInstance.verify();
    console.log('✅ Email transporter ready');
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.warn('⚠️ Emails will not be sent until SMTP is configured correctly');
    return false;
  }
};

// Create transporter instance
const transporter = createTransporter();

export { transporter, verifyTransporter };
export default transporter;
