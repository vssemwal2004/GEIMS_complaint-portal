/**
 * Email Configuration
 * 
 * Configures email sending via Brevo HTTP API (not SMTP).
 * This bypasses SMTP port blocking on platforms like Render.
 * All credentials are loaded from environment variables.
 * 
 * Security Considerations:
 * - No hardcoded credentials
 * - Uses HTTPS (port 443) which is never blocked
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath, override: true });

/**
 * Parse email from various formats
 * Handles: "Name <email@example.com>", "<email@example.com>", "email@example.com"
 * @param {string} input
 * @returns {{ name: string|null, email: string|null }}
 */
const parseEmailAddress = (input) => {
  if (!input) return { name: null, email: null };
  
  // Match "Name <email>" format
  const match = input.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  
  // Match "<email>" format
  const angleMatch = input.match(/^<([^>]+)>$/);
  if (angleMatch) {
    return { name: null, email: angleMatch[1].trim() };
  }
  
  // Plain email
  return { name: null, email: input.trim() };
};

/**
 * Send email using Brevo HTTP API
 * @param {Object} options
 * @param {string} options.from - Sender email (must be verified in Brevo)
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>}
 */
const sendMail = async ({ from, to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  // Parse the from address (handles "Name <email>" format)
  const parsed = parseEmailAddress(from);
  const fromName = parsed.name || process.env.SMTP_FROM_NAME || 'GEIMS Complaint Portal';
  const fromEmail = parsed.email || process.env.SMTP_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error('valid sender email required');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || subject || 'Email from GEIMS Complaint Portal',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Brevo API error: ${response.status}`);
  }

  const result = await response.json();
  return { messageId: result.messageId };
};

/**
 * Transporter-like object for compatibility with existing code
 */
const transporter = {
  sendMail: async (options) => {
    return sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  },
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>}
 */
const verifyTransporter = async () => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.SMTP_FROM_EMAIL;

    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not set');
    }
    if (!fromEmail) {
      throw new Error('SMTP_FROM_EMAIL is not set');
    }

    // Test API connectivity
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brevo API returned ${response.status}`);
    }

    console.log('✅ Email service ready (Brevo HTTP API)');
    return true;
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    console.warn('⚠️ Emails will not be sent until Brevo is configured correctly');
    return false;
  }
};

export { transporter, verifyTransporter };
export default transporter;
