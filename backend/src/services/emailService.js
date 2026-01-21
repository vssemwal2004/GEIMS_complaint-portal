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

const getWebsiteUrl = () => {
  const url =
    process.env.GEIMS_WEBSITE_URL ||
    process.env.WEBSITE_URL ||
    'https://geims.geu.ac.in/sc';
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
    body { margin: 0; padding: 0; background: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { color: #16a34a; text-decoration: none; }
    .container { width: 100%; background: #f5f5f7; padding: 32px 16px; }
    .card { width: 100%; max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { padding: 24px 32px; background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); border-bottom: none; }
    .brand { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; color: #ffffff; font-weight: 600; letter-spacing: 0.3px; }
    .content { padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.6; font-size: 15px; }
    .greeting { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0; }
    .muted { color: #6b7280; font-size: 14px; line-height: 1.5; }
    .title { font-size: 22px; font-weight: 700; margin: 0 0 8px 0; color: #111827; }
    .subtitle { margin: 0 0 20px 0; color: #6b7280; font-size: 15px; line-height: 1.5; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
    .button { display: inline-block; padding: 14px 24px; background: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .info { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 3px solid #16a34a; padding: 16px 20px; border-radius: 8px; margin: 16px 0; }
    .warning { color: #dc2626; font-weight: 600; }
    .success { color: #16a34a; font-weight: 600; }
    .credentials { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px 20px; border-radius: 8px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace; font-size: 14px; color: #374151; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 3px solid #16a34a; padding: 16px 20px; border-radius: 8px; margin: 16px 0; }
    .footer { padding: 24px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #9ca3af; text-align: center; background: #fafafa; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
    p { margin: 0 0 16px 0; }
    ul, ol { margin: 0 0 16px 0; padding-left: 24px; }
    li { margin-bottom: 8px; }
    h3 { font-size: 16px; font-weight: 600; color: #374151; margin: 20px 0 12px 0; }
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
  const websiteUrl = getWebsiteUrl();

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
                      <div style="color: #ffffff; font-size: 13px; font-weight: 500;">Graphic Era Institute of Medical Sciences</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="content">
                ${body}
                ${
                  websiteUrl
                    ? `
                  <div class="divider"></div>
                  <div style="text-align:center;">
                    <a class="button" href="${escapeHtmlAttr(websiteUrl)}" target="_blank" rel="noopener noreferrer">Visit</a>
                    <div class="muted" style="margin-top:10px;">If the button doesn’t work, copy and paste this link:</div>
                    <div style="margin-top:6px;"><a href="${escapeHtmlAttr(websiteUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(websiteUrl)}</a></div>
                  </div>
                `
                    : ''
                }
              </td>
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

const appendVisitLinkToText = (text) => {
  const websiteUrl = getWebsiteUrl();
  if (!websiteUrl) return text;

  const base = String(text || '').trim();
  const suffix = `Visit: ${websiteUrl}`;

  if (!base) return suffix;
  if (base.includes(websiteUrl)) return base;
  return `${base}\n\n${suffix}`;
};

const buildEmail = ({ subject, body, preheader, text }) => {
  const logoUrl = getLogoUrl();

  // IMPORTANT: Do not attach/embed the logo as an email attachment.
  // Some clients (e.g., Gmail) show inline CID images as downloadable attachments.
  // We only reference a public URL in the HTML.
  return {
    html: emailWrapper(subject, body, { preheader, logoSrc: logoUrl }),
    attachments: [],
    text: appendVisitLinkToText(text),
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
    <p class="greeting">Dear Student, ${escapeHtml(name)}</p>
    
    <p>Your account has been successfully created on the <strong>GEIMS Complaint Portal</strong>. We're pleased to welcome you to our platform.</p>
    
    <p>College: <strong>${escapeHtml(college)}</strong></p>
    
    <div class="info-box">
      <h3 style="margin: 0 0 12px 0; color: #166534;">Your Login Credentials</h3>
      <div class="credentials">
        <div style="margin-bottom: 10px;"><strong>Email:</strong> ${escapeHtml(email)}</div>
        <div><strong>Temporary Password:</strong> ${escapeHtml(temporaryPassword)}</div>
      </div>
    </div>
    
    <p class="warning" style="margin: 20px 0;">⚠️ Important: You must change your password upon first login for security purposes.</p>
    
    <h3>Getting Started:</h3>
    <ol style="color: #374151;">
      <li>Visit the GEIMS Complaint Portal login page</li>
      <li>Enter your email and temporary password</li>
      <li>Create a new secure password</li>
      <li>Start submitting complaints or feedback</li>
    </ol>
    
    <h3>Password Requirements:</h3>
    <ul style="color: #374151;">
      <li>Minimum 8 characters</li>
      <li>At least one uppercase letter</li>
      <li>At least one lowercase letter</li>
      <li>At least one number</li>
      <li>At least one special character</li>
    </ul>
    
    <p style="margin: 24px 0 0 0;">If you have any questions, please contact your administrator.</p>
    
    <p style="margin: 16px 0 0 0; color: #6b7280;">Best regards,<br/><strong>GEIMS Administration Team</strong></p>
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

  const info = await sendBrandedMail({
    to: email,
    subject,
    body,
    preheader: 'Password reset requested. Link expires soon.',
    text,
  });

  console.log(`✅ Password reset email sent to ${email}`);
  return { success: true, messageId: info.messageId };
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

/**
 * Send account updated email
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.name - User name
 * @param {string} params.role - User role (student, employee, sub-admin)
 * @param {Object} params.changes - Changes made
 * @returns {Promise<Object>}
 */
export const sendAccountUpdatedEmail = async ({ email, name, role, changes }) => {
  const roleTitle = role === 'student' ? 'Student' : role === 'employee' ? 'Employee' : 'Sub-Admin';
  const roleGreeting = `Dear ${roleTitle}, ${escapeHtml(name)}`;
  const subject = 'Account Information Updated - GEIMS Complaint Portal';
  
  const changesList = Object.entries(changes)
    .map(([key, value]) => `<li><strong>${key}:</strong> ${escapeHtml(String(value))}</li>`)
    .join('');
  
  const body = `
    <p class="greeting">${roleGreeting}</p>
    
    <p>Your account information has been updated by the administrator on the <strong>GEIMS Complaint Portal</strong>.</p>
    
    <div class="info-box">
      <h3 style="margin: 0 0 12px 0; color: #166534;">Updated Information</h3>
      <ul style="margin: 0; color: #374151;">
        ${changesList}
      </ul>
    </div>
    
    <div class="info" style="background: #eff6ff; border-color: #bfdbfe; border-left-color: #3b82f6;">
      <p style="margin: 0; color: #1e40af;"><strong>Update Date:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
    </div>
    
    <p class="warning" style="margin: 20px 0;">If you did not request this change or believe this is an error, please contact the administrator immediately.</p>
    
    <p style="margin: 24px 0 0 0;">You can continue using the portal with your updated information.</p>
    
    <p style="margin: 16px 0 0 0; color: #6b7280;">Best regards,<br/><strong>GEIMS Administration Team</strong></p>
  `;
  
  try {
    const info = await sendBrandedMail({
      to: email,
      subject,
      body,
      preheader: 'Your account information has been updated by the administrator.',
    });
    
    console.log(`✅ Account updated email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send account updated email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send account deletion notification email
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.name - User name
 * @param {string} params.role - User role (student, employee, sub-admin)
 * @returns {Promise<Object>}
 */
export const sendAccountDeletedEmail = async ({ email, name, role }) => {
  const roleTitle = role === 'student' ? 'Student' : role === 'employee' ? 'Employee' : 'Sub-Admin';
  const roleGreeting = `Dear ${roleTitle}, ${escapeHtml(name)}`;
  const subject = 'Account Deactivated - GEIMS Complaint Portal';
  
  const body = `
    <p class="greeting">${roleGreeting}</p>
    
    <p>We are writing to inform you that your account on the <strong>GEIMS Complaint Portal</strong> has been deactivated by the administrator.</p>
    
    <div class="info" style="background: #fef2f2; border-color: #fecaca; border-left-color: #dc2626;">
      <h3 style="margin: 0 0 12px 0; color: #991b1b;">Account Deactivation Details</h3>
      <p style="margin: 0; color: #7f1d1d;"><strong>Account Type:</strong> ${escapeHtml(roleTitle)}</p>
      <p style="margin: 8px 0 0 0; color: #7f1d1d;"><strong>Deactivation Date:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
    </div>
    
    <p style="margin: 20px 0;">You will no longer be able to access the complaint portal with this account.</p>
    
    <p><strong>What this means:</strong></p>
    <ul style="color: #374151;">
      <li>Your login credentials will no longer work</li>
      <li>You cannot submit new complaints</li>
      <li>You cannot access existing complaints</li>
    </ul>
    
    <p class="warning" style="margin: 20px 0;">If you believe this is an error, please contact the administrator immediately.</p>
    
    <p style="margin: 24px 0 0 0;">Thank you for using the GEIMS Complaint Portal.</p>
    
    <p style="margin: 16px 0 0 0; color: #6b7280;">Best regards,<br/><strong>GEIMS Administration Team</strong></p>
  `;
  
  try {
    const info = await sendBrandedMail({
      to: email,
      subject,
      body,
      preheader: 'Your GEIMS Complaint Portal account has been deactivated.',
    });
    
    console.log(`✅ Account deleted email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send account deleted email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendAccountCreatedEmail,
  sendPasswordChangedEmail,
  sendComplaintSubmittedEmail,
  sendComplaintResolvedEmail,
  sendStatusUpdateEmail,
  sendAccountUpdatedEmail,
  sendAccountDeletedEmail,
};
