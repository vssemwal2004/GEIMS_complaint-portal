/**
 * Email Service
 * 
 * Provides email sending functionality with professional templates.
 * Handles account creation, password reset, and complaint acknowledgment emails.
 * 
 * Security Considerations:
 * - No sensitive data in email templates
 * - HTML escaping for user-provided content
 * - Error handling without exposing internal details
 */

import transporter from '../config/email.js';
import validator from 'validator';

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Helper to build a valid "from" address from env vars
const getFromAddress = () => {
  const name = process.env.SMTP_FROM_NAME || 'GEIMS Complaint Portal';
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  return email ? `${name} <${email}>` : undefined;
};

/**
 * Escape HTML entities in user content
 * @param {string} text
 * @returns {string}
 */
const escapeHtml = (text) => {
  return validator.escape(String(text || ''));
};

/**
 * Base email styles for consistent branding
 */
const emailStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .info-box { background: #f0f4ff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea; }
    .warning { color: #dc3545; font-weight: bold; }
    .success { color: #28a745; font-weight: bold; }
    h1 { margin: 0; font-size: 24px; }
    h2 { color: #667eea; }
    .credentials { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; }
  </style>
`;

/**
 * Generate HTML email wrapper
 * @param {string} title
 * @param {string} body
 * @returns {string}
 */
const emailWrapper = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 GEIMS Complaint Portal</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>This is an automated email from GEIMS Complaint Portal.</p>
      <p>Please do not reply to this email.</p>
      <p>© ${new Date().getFullYear()} GEIMS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send account creation email to new student
 * @param {Object} params
 * @param {string} params.email - Student email
 * @param {string} params.name - Student name
 * @param {string} params.temporaryPassword - Generated temporary password
 * @param {string} params.college - College name
 * @returns {Promise<Object>}
 */
export const sendAccountCreatedEmail = async ({ email, name, temporaryPassword, college }) => {
  const subject = 'Welcome to GEIMS Complaint Portal - Your Account Details';
  
  const body = `
    <h2>Welcome, ${escapeHtml(name)}! 👋</h2>
    
    <p>Your account has been created on the <strong>GEIMS Complaint Portal</strong>.</p>
    
    <p>College: <strong>${escapeHtml(college)}</strong></p>
    
    <div class="info-box">
      <h3>📧 Your Login Credentials</h3>
      <div class="credentials">
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Temporary Password:</strong> ${escapeHtml(temporaryPassword)}</p>
      </div>
    </div>
    
    <p class="warning">⚠️ Important: You will be required to change your password on first login.</p>
    
    <h3>📝 How to Get Started:</h3>
    <ol>
      <li>Visit the GEIMS Complaint Portal login page</li>
      <li>Enter your email and temporary password</li>
      <li>Change your password to something secure</li>
      <li>Start submitting complaints or feedback</li>
    </ol>
    
    <h3>🔒 Password Requirements:</h3>
    <ul>
      <li>Minimum 8 characters</li>
      <li>At least one uppercase letter</li>
      <li>At least one lowercase letter</li>
      <li>At least one number</li>
      <li>At least one special character</li>
    </ul>
    
    <p>If you have any questions, please contact your administrator.</p>
  `;
  
  const html = emailWrapper(subject, body);
  
  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject,
      html,
    });
    
    console.log(`✅ Account created email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send account email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send password change confirmation email
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.name - User name
 * @returns {Promise<Object>}
 */
export const sendPasswordChangedEmail = async ({ email, name }) => {
  const subject = 'Password Changed Successfully - GEIMS Complaint Portal';
  
  const body = `
    <h2>Password Changed Successfully ✅</h2>
    
    <p>Hello ${escapeHtml(name)},</p>
    
    <p>Your password has been changed successfully on the GEIMS Complaint Portal.</p>
    
    <div class="info-box">
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <p class="warning">⚠️ If you did not make this change, please contact your administrator immediately.</p>
    
    <h3>🔒 Security Tips:</h3>
    <ul>
      <li>Never share your password with anyone</li>
      <li>Use a unique password for this portal</li>
      <li>Log out when using shared computers</li>
    </ul>
  `;
  
  const html = emailWrapper(subject, body);
  
  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject,
      html,
    });
    
    console.log(`✅ Password changed email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send password changed email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send complaint resolved acknowledgment email
 * @param {Object} params
 * @param {string} params.email - Student email
 * @param {string} params.name - Student name
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.acknowledgment - Admin acknowledgment text
 * @param {Date} params.submittedAt - Original submission date
 * @returns {Promise<Object>}
 */
export const sendComplaintResolvedEmail = async ({ email, name, complaintId, acknowledgment, submittedAt }) => {
  const subject = 'Your Complaint Has Been Resolved - GEIMS Complaint Portal';
  
  const body = `
    <h2>Complaint Resolved 🎉</h2>
    
    <p>Hello ${escapeHtml(name)},</p>
    
    <p>Great news! Your complaint has been reviewed and resolved by the administration.</p>
    
    <div class="info-box">
      <h3>📋 Complaint Details</h3>
      <p><strong>Complaint ID:</strong> ${escapeHtml(complaintId)}</p>
      <p><strong>Submitted:</strong> ${new Date(submittedAt).toLocaleString()}</p>
      <p><strong>Resolved:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="info-box" style="border-left-color: #28a745;">
      <h3>✅ Admin Response</h3>
      <p>${escapeHtml(acknowledgment)}</p>
    </div>
    
    <p>You can view the full details by logging into the GEIMS Complaint Portal.</p>
    
    <p>Thank you for your feedback. It helps us improve!</p>
  `;
  
  const html = emailWrapper(subject, body);
  
  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject,
      html,
    });
    
    console.log(`✅ Complaint resolved email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send complaint resolved email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send complaint status update email
 * @param {Object} params
 * @param {string} params.email - Student email
 * @param {string} params.name - Student name
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.status - New status
 * @returns {Promise<Object>}
 */
export const sendStatusUpdateEmail = async ({ email, name, complaintId, status }) => {
  const subject = `Complaint Status Updated - ${status.replace('_', ' ')} - GEIMS`;
  
  const statusColors = {
    READ: '#17a2b8',
    UNDER_REVIEW: '#ffc107',
    RESOLVED: '#28a745',
  };
  
  const statusMessages = {
    READ: 'Your complaint has been read by the administration.',
    UNDER_REVIEW: 'Your complaint is currently under review.',
    RESOLVED: 'Your complaint has been resolved.',
  };
  
  const body = `
    <h2>Complaint Status Update 📬</h2>
    
    <p>Hello ${escapeHtml(name)},</p>
    
    <p>There's an update on your complaint.</p>
    
    <div class="info-box" style="border-left-color: ${statusColors[status] || '#667eea'};">
      <h3>📋 Status: <span style="color: ${statusColors[status]}">${escapeHtml(status.replace('_', ' '))}</span></h3>
      <p><strong>Complaint ID:</strong> ${escapeHtml(complaintId)}</p>
      <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <p>${statusMessages[status] || 'Your complaint status has been updated.'}</p>
    
    <p>Log in to the portal to view more details.</p>
  `;
  
  const html = emailWrapper(subject, body);
  
  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject,
      html,
    });
    
    console.log(`✅ Status update email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send status update email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendAccountCreatedEmail,
  sendPasswordChangedEmail,
  sendComplaintResolvedEmail,
  sendStatusUpdateEmail,
};
