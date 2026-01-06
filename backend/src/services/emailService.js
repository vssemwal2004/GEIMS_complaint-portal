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

// For HTML attribute values (href/src). Do NOT escape forward slashes,
// as some email clients fail to load URLs containing entities like "&#x2F;".
const escapeHtmlAttr = (value) => {
  const text = String(value || '');
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
};

const getFrontendBaseUrl = () => {
  const url =
    process.env.FRONTEND_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    process.env.PUBLIC_URL ||
    '';
  return String(url || '').trim();
};

const getLogoUrl = () => {
  // Default logo (provided by user) – reliable absolute URL for email clients
  const defaultLogoUrl = 'https://geims.geu.ac.in/wp-content/uploads/2023/11/logo-1.png';

  // Prefer an explicit public logo URL for emails (best reliability across clients)
  const explicitLogoUrl = (process.env.EMAIL_LOGO_URL || process.env.MAIL_LOGO_URL || '').trim();
  if (explicitLogoUrl) return explicitLogoUrl;

  if (defaultLogoUrl) return defaultLogoUrl;

  const baseUrl = getFrontendBaseUrl();
  if (!baseUrl) return '';
  return `${baseUrl.replace(/\/$/, '')}/geims-logo.webp`;
};

const buildLogoBlock = ({ src }) => {
  if (!src) return '';

  // Use a wider logo for better brand visibility in email headers.
  // Keep inline styles for maximum email-client compatibility.
  return `
    <img
      src="${escapeHtmlAttr(src)}"
      alt="GEIMS"
      width="160"
      height="48"
      style="width:160px;height:48px;object-fit:contain;display:block;"
    />
  `;
};

/**
 * Base email styles for consistent branding
 */
const emailStyles = `
  <style>
    /* Keep styles simple for broad email-client support */
    body { margin: 0; padding: 0; background: #f6f7f9; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { color: #16a34a; }
    .container { width: 100%; background: #f6f7f9; padding: 24px 0; }
    .card { width: 100%; max-width: 600px; background: #ffffff; border: 1px solid #e7e9ee; border-radius: 14px; overflow: hidden; }
    .header { padding: 20px 24px; background: #ffffff; border-bottom: 1px solid #eef0f4; }
    .brand { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #0f172a; font-weight: 700; }
    .content { padding: 24px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; line-height: 1.6; }
    .muted { color: #64748b; font-size: 13px; }
    .title { font-size: 20px; font-weight: 800; margin: 0 0 6px 0; color: #0f172a; }
    .subtitle { margin: 0 0 18px 0; color: #475569; font-size: 14px; }
    .divider { height: 1px; background: #eef0f4; margin: 18px 0; }
    .button { display: inline-block; padding: 12px 18px; background: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 800; }
    .info { background: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #16a34a; padding: 12px 14px; border-radius: 10px; }
    .warning { color: #b91c1c; font-weight: 700; }
    .success { color: #16a34a; font-weight: 700; }
    .credentials { background: #f8fafc; border: 1px solid #eef0f4; padding: 12px 14px; border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; }
    /* Backwards-compatible class for older templates */
    .info-box { background: #f0fdf4; border: 1px solid #dcfce7; border-left: 4px solid #16a34a; padding: 12px 14px; border-radius: 10px; }
    .footer { padding: 16px 24px 22px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #64748b; text-align: center; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
  </style>
`;

/**
 * Generate HTML email wrapper
 * @param {string} title
 * @param {string} body
 * @returns {string}
 */
const emailWrapper = (title, body, { preheader = '', logoSrc = '' } = {}) => {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${emailStyles}
  </head>
  <body>
    <span class="preheader">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" class="container">
      <tr>
        <td align="center">
          <table role="presentation" class="card">
            <tr>
              <td class="header">
                <table role="presentation" width="100%">
                  <tr>
                    <td align="left" valign="middle">
                      ${buildLogoBlock({ src: logoSrc })}
                    </td>
                    <td align="left" valign="middle" style="padding-left: 12px;">
                      <div class="brand">GEIMS Complaint Portal</div>
                      <div class="muted">Graphic Era Institute of Medical Sciences</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="content">${body}</td>
            </tr>
            <tr>
              <td class="footer">
                <div>This is an automated email. Please do not reply.</div>
                <div style="margin-top: 6px;">© ${year} GEIMS. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};

const buildEmail = ({ subject, body, preheader, text }) => {
  const logoUrl = getLogoUrl();

  // IMPORTANT: Do not attach/embed the logo as an email attachment.
  // Some clients (e.g., Gmail) show inline CID images as downloadable attachments.
  // We only reference a public URL in the HTML.
  return {
    html: emailWrapper(subject, body, { preheader, logoSrc: logoUrl }),
    attachments: [],
    text,
  };
};

const sendBrandedMail = async ({ to, subject, body, preheader, text }) => {
  const email = buildEmail({ subject, body, preheader, text });

  return transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html: email.html,
    text: email.text,
    attachments: [],
  });
};

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
  
  try {
    const info = await sendBrandedMail({
      to: email,
      subject,
      body,
      preheader: 'Your GEIMS Complaint Portal account is ready. Temporary password inside.',
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
  
  try {
    const info = await sendBrandedMail({
      to: email,
      subject,
      body,
      preheader: 'Your GEIMS Complaint Portal password was changed.',
    });
    
    console.log(`✅ Password changed email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send password changed email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email with secure reset link
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.name - User name
 * @param {string} params.resetUrl - Password reset URL
 * @param {number} [params.expiresMinutes=60] - Expiration time for the link
 * @returns {Promise<Object>}
 */
export const sendPasswordResetEmail = async ({ email, name, resetUrl, expiresMinutes = 60 }) => {
  const subject = 'Reset Your Password - GEIMS Complaint Portal';

  const body = `
    <h2 class="title">Reset your password</h2>
    <p class="subtitle">Use the button below to set a new password for your account.</p>

    <p>Hello ${escapeHtml(name || '') || 'there'},</p>
    <p>We received a request to reset the password for your GEIMS Complaint Portal account.</p>

    <div class="info">
      <strong>Reset link expires in:</strong> ${escapeHtml(String(expiresMinutes))} minutes
    </div>

    <div class="divider"></div>

    <p style="margin: 0 0 16px 0;">
      <a class="button" href="${escapeHtmlAttr(resetUrl)}">Reset Password</a>
    </p>

    <p class="muted" style="margin: 0;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p class="muted" style="margin: 8px 0 0 0; word-break: break-all;">${escapeHtml(resetUrl)}</p>

    <div class="divider"></div>
    <p class="warning" style="margin: 0;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  `;

  const text = [
    'Reset your password',
    '',
    `Hello ${name || 'there'},`,
    '',
    'We received a request to reset the password for your GEIMS Complaint Portal account.',
    `This link expires in ${expiresMinutes} minutes.`,
    '',
    `Reset link: ${resetUrl}`,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
  ].join('\n');

  try {
    const info = await sendBrandedMail({
      to: email,
      subject,
      body,
      preheader: 'Password reset requested. Link expires soon.',
      text,
    });

    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send complaint submission acknowledgment email
 * @param {Object} params
 * @param {string} params.email - Student email
 * @param {string} params.name - Student name
 * @param {string} params.complaintId - Complaint ID (GEIMS + 6 digits)
 * @param {string} params.subject - Complaint subject
 * @param {string} params.content - Complaint body/content
 * @returns {Promise<Object>}
 */
export const sendComplaintSubmittedEmail = async ({ email, name, complaintId, subject, content }) => {
  const emailSubject = `Complaint Received - ${complaintId} - GEIMS Complaint Portal`;
  
  // Truncate content for preview if too long
  const contentPreview = content.length > 500 ? content.substring(0, 500) + '...' : content;
  
  const body = `
    <h2 class="title">Complaint Received</h2>
    <p class="subtitle">Your complaint has been successfully submitted.</p>

    <p>Hello ${escapeHtml(name)},</p>
    <p>Thank you for submitting your complaint. We have received it and will review it shortly.</p>

    <div class="info">
      <div><strong>Complaint ID:</strong> ${escapeHtml(complaintId)}</div>
      <div><strong>Submitted:</strong> ${escapeHtml(new Date().toLocaleString())}</div>
      <div><strong>Status:</strong> <span style="color: #17a2b8;">READ</span></div>
    </div>

    <div class="divider"></div>

    <div class="info">
      <div><strong>Subject:</strong></div>
      <div style="margin-top: 6px; font-weight: 600;">${escapeHtml(subject)}</div>
    </div>

    <div class="divider"></div>

    <div class="info">
      <div><strong>Complaint Details:</strong></div>
      <div style="margin-top: 6px; white-space: pre-wrap;">${escapeHtml(contentPreview)}</div>
    </div>

    <div class="divider"></div>
    <p class="muted" style="margin: 0;">You can track the status of your complaint by logging into the portal.</p>
    <p class="muted" style="margin: 6px 0 0 0;">Please save your Complaint ID <strong>${escapeHtml(complaintId)}</strong> for future reference.</p>
  `;

  const text = [
    'Complaint Received',
    '',
    `Hello ${name},`,
    '',
    'Thank you for submitting your complaint. We have received it and will review it shortly.',
    '',
    `Complaint ID: ${complaintId}`,
    `Submitted: ${new Date().toLocaleString()}`,
    'Status: READ',
    '',
    `Subject: ${subject}`,
    '',
    'Complaint Details:',
    contentPreview,
  ].join('\n');
  
  try {
    const info = await sendBrandedMail({
      to: email,
      subject: emailSubject,
      body,
      preheader: `Your complaint ${complaintId} has been received. We will review it shortly.`,
      text,
    });
    
    console.log(`✅ Complaint submitted email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send complaint submitted email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send complaint resolved acknowledgment email
 * @param {Object} params
 * @param {string} params.email - Student email
 * @param {string} params.name - Student name
 * @param {string} params.complaintId - Complaint ID
 * @param {string} params.subject - Complaint subject
 * @param {string} params.content - Complaint body/content
 * @param {string} params.acknowledgment - Admin acknowledgment text
 * @param {Date} params.submittedAt - Original submission date
 * @returns {Promise<Object>}
 */
export const sendComplaintResolvedEmail = async ({ email, name, complaintId, subject, content, acknowledgment, submittedAt }) => {
  const emailSubject = `Complaint Resolved - ${complaintId} - GEIMS Complaint Portal`;
  
  // Truncate content for preview if too long
  const contentPreview = content && content.length > 300 ? content.substring(0, 300) + '...' : (content || '');
  
  const body = `
    <h2 class="title">Complaint Resolved</h2>
    <p class="subtitle">The administration has resolved your complaint.</p>

    <p>Hello ${escapeHtml(name)},</p>
    <p>Your complaint has been reviewed and marked as <span class="success">Resolved</span>.</p>

    <div class="info">
      <div><strong>Complaint ID:</strong> ${escapeHtml(complaintId)}</div>
      <div><strong>Submitted:</strong> ${escapeHtml(new Date(submittedAt).toLocaleString())}</div>
      <div><strong>Resolved:</strong> ${escapeHtml(new Date().toLocaleString())}</div>
    </div>

    <div class="divider"></div>

    <div class="info">
      <div><strong>Subject:</strong></div>
      <div style="margin-top: 6px; font-weight: 600;">${escapeHtml(subject || 'N/A')}</div>
    </div>

    ${contentPreview ? `
    <div class="divider"></div>
    <div class="info">
      <div><strong>Your Complaint:</strong></div>
      <div style="margin-top: 6px; white-space: pre-wrap;">${escapeHtml(contentPreview)}</div>
    </div>
    ` : ''}

    <div class="divider"></div>

    <div class="info" style="background: #f0f9ff; border-color: #bae6fd; border-left-color: #0ea5e9;">
      <div><strong>Admin Response:</strong></div>
      <div style="margin-top: 6px; white-space: pre-wrap;">${escapeHtml(acknowledgment)}</div>
    </div>

    <div class="divider"></div>
    <p class="muted" style="margin: 0;">You can view the full details by logging into the portal.</p>
  `;

  const text = [
    'Complaint Resolved',
    '',
    `Hello ${name},`,
    '',
    `Complaint ID: ${complaintId}`,
    `Subject: ${subject || 'N/A'}`,
    `Submitted: ${new Date(submittedAt).toLocaleString()}`,
    `Resolved: ${new Date().toLocaleString()}`,
    '',
    'Admin Response:',
    acknowledgment,
  ].join('\n');
  
  try {
      const info = await sendBrandedMail({
        to: email,
        subject: emailSubject,
        body,
        preheader: `Your complaint ${complaintId} was resolved. View the admin response in the portal.`,
        text,
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
 * @param {string} params.subject - Complaint subject
 * @param {string} params.status - New status
 * @returns {Promise<Object>}
 */
export const sendStatusUpdateEmail = async ({ email, name, complaintId, subject: complaintSubject, status }) => {
  const emailSubject = `Complaint Status Updated - ${complaintId} - ${status.replace('_', ' ')}`;
  
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
    <h2 class="title">Complaint Status Updated</h2>
    <p class="subtitle">There is an update on your complaint.</p>

    <p>Hello ${escapeHtml(name)},</p>

    <div class="info">
      <div><strong>Complaint ID:</strong> ${escapeHtml(complaintId)}</div>
      <div><strong>Subject:</strong> ${escapeHtml(complaintSubject || 'N/A')}</div>
      <div><strong>Status:</strong> <span style="color: ${statusColors[status] || '#000'};">${escapeHtml(status.replace('_', ' '))}</span></div>
      <div><strong>Updated:</strong> ${escapeHtml(new Date().toLocaleString())}</div>
    </div>

    <div class="divider"></div>
    <p style="margin: 0;">${escapeHtml(statusMessages[status] || 'Your complaint status has been updated.')}</p>

    <p class="muted" style="margin: 12px 0 0 0;">Log in to the portal to view more details.</p>
  `;

  const text = [
    'Complaint Status Updated',
    '',
    `Hello ${name},`,
    '',
    `Complaint ID: ${complaintId}`,
    `Subject: ${complaintSubject || 'N/A'}`,
    `Status: ${status.replace('_', ' ')}`,
    `Updated: ${new Date().toLocaleString()}`,
    '',
    statusMessages[status] || 'Your complaint status has been updated.',
  ].join('\n');
  
  try {
      const info = await sendBrandedMail({
        to: email,
        subject: emailSubject,
        body,
        preheader: `Complaint ${complaintId} status updated to ${status.replace('_', ' ')}.`,
        text,
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
  sendComplaintSubmittedEmail,
  sendComplaintResolvedEmail,
  sendStatusUpdateEmail,
};
