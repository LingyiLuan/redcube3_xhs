/**
 * Email Service
 *
 * Handles sending emails using Nodemailer with Gmail SMTP
 * Based on industry best practices (2025):
 * - Support for both OAuth2 (recommended) and App Password authentication
 * - HTML email templates
 * - Secure SMTP configuration
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment configuration
 * Supports both OAuth2 and App Password authentication methods
 */
function createTransporter() {
  // Use port 587 with STARTTLS (often not blocked by cloud providers)
  // or port 465 with SSL (sometimes blocked)
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const useSSL = smtpPort === 465;

  const emailConfig = {
    host: 'smtp.gmail.com',
    port: smtpPort,
    secure: useSSL, // true for 465, false for 587
    connectionTimeout: 10000, // 10 second connection timeout
    greetingTimeout: 10000, // 10 second greeting timeout
    socketTimeout: 15000, // 15 second socket timeout
  };

  // For port 587, require TLS upgrade
  if (!useSSL) {
    emailConfig.requireTLS = true;
  }

  // Check if OAuth2 credentials are provided (recommended method)
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    emailConfig.auth = {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    };
    console.log('[EmailService] Using OAuth2 authentication on port', smtpPort);
  }
  // Fall back to App Password method
  else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    emailConfig.auth = {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    };
    console.log('[EmailService] Using App Password authentication on port', smtpPort);
  }
  // No email credentials configured
  else {
    console.warn('[EmailService] No email credentials configured. Email sending will be simulated.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
}

/**
 * Generate verification email HTML template
 * @param {string} email - User's email address
 * @param {string} verificationUrl - Full verification URL with token
 * @returns {string} - HTML email content
 */
function generateVerificationEmailHTML(email, verificationUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Interview Intel</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
                    Interview Intel
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
                    AI-Powered Interview Intelligence Platform
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                    Verify Your Email Address
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    Thanks for signing up for Interview Intel! To complete your registration and start accessing career insights, please verify your email address by clicking the button below.
                  </p>

                  <!-- Verification Button -->
                  <table role="presentation" style="margin: 30px 0;">
                    <tr>
                      <td style="border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <a href="${verificationUrl}"
                           target="_blank"
                           style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 4px;">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 20px 0 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 8px 0 0 0; color: #667eea; font-size: 13px; word-break: break-all;">
                    ${verificationUrl}
                  </p>

                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

                  <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.6;">
                    This verification link will expire in 24 hours. If you didn't create an account with Interview Intel, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f8f8f8; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                    &copy; 2025 Interview Intel. All rights reserved.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #8a8a8a; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} token - Verification token (plaintext, not hashed)
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise
 */
async function sendVerificationEmail(email, token) {
  try {
    // Create transporter
    const transporter = createTransporter();

    // If no transporter (no credentials), simulate email sending
    if (!transporter) {
      console.log('[EmailService] SIMULATED: Would send verification email to:', email);
      console.log('[EmailService] SIMULATED: Verification token:', token);
      console.log('[EmailService] SIMULATED: Verification URL:', generateVerificationUrl(token));
      return true; // Return success for development
    }

    // Generate verification URL
    const verificationUrl = generateVerificationUrl(token, email);

    // Email options
    const mailOptions = {
      from: {
        name: 'Interview Intel',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: 'Verify Your Email - Interview Intel',
      html: generateVerificationEmailHTML(email, verificationUrl),
      text: `Welcome to Interview Intel!\n\nPlease verify your email address by visiting this link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('[EmailService] Verification email sent successfully:', {
      messageId: info.messageId,
      recipient: email
    });

    return true;
  } catch (error) {
    console.error('[EmailService] Failed to send verification email:', error);
    return false;
  }
}

/**
 * Generate verification URL
 * @param {string} token - Verification token
 * @param {string} email - User's email address
 * @returns {string} - Full verification URL
 */
function generateVerificationUrl(token, email) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
}

/**
 * Generate password reset email HTML template
 * @param {string} email - User's email address
 * @param {string} resetUrl - Full password reset URL with token
 * @returns {string} - HTML email content
 */
function generatePasswordResetEmailHTML(email, resetUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Interview Intel</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
                    Interview Intel
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
                    AI-Powered Interview Intelligence Platform
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                    Reset Your Password
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password for your Interview Intel account. If you made this request, click the button below to create a new password.
                  </p>

                  <!-- Reset Button -->
                  <table role="presentation" style="margin: 30px 0;">
                    <tr>
                      <td style="border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <a href="${resetUrl}"
                           target="_blank"
                           style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 4px;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 20px 0 0 0; color: #8a8a8a; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this URL into your browser:
                  </p>
                  <p style="margin: 8px 0 0 0; color: #667eea; font-size: 13px; word-break: break-all;">
                    ${resetUrl}
                  </p>

                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">

                  <p style="margin: 0 0 12px 0; color: #d32f2f; font-size: 14px; font-weight: 600; line-height: 1.6;">
                    If you didn't request a password reset, please ignore this email.
                  </p>
                  <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.6;">
                    This password reset link will expire in 24 hours. Your password will not change unless you click the link above and create a new one.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f8f8f8; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                    &copy; 2025 Interview Intel. All rights reserved.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #8a8a8a; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} token - Password reset token
 * @returns {Promise<boolean>} - True if sent successfully
 * @throws {Error} - Throws if email sending fails (for proper error handling)
 */
async function sendPasswordResetEmail(email, token) {
  const transporter = createTransporter();

  // If no transporter, simulate sending (for development without email config)
  if (!transporter) {
    console.log('[EmailService] SIMULATED: Would send password reset email to:', email);
    console.log('[EmailService] SIMULATED: Reset token:', token);
    console.log('[EmailService] SIMULATED: Reset URL:', generatePasswordResetUrl(token));
    return true; // Return success for development
  }

  // Generate reset URL
  const resetUrl = generatePasswordResetUrl(token);

  // Email options
  const mailOptions = {
    from: {
      name: 'Interview Intel',
      address: process.env.GMAIL_USER
    },
    to: email,
    subject: 'Reset Your Password - Interview Intel',
    html: generatePasswordResetEmailHTML(email, resetUrl),
    text: `Password Reset Request\n\nWe received a request to reset your password for your Interview Intel account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nYour password will not change unless you click the link above and create a new one.`
  };

  // Send email with timeout handling
  try {
    const info = await transporter.sendMail(mailOptions);

    console.log('[EmailService] Password reset email sent successfully:', {
      messageId: info.messageId,
      recipient: email
    });
    return true;
  } catch (error) {
    console.error('[EmailService] Failed to send password reset email:', error.message);
    // Throw error so the route handler knows sending failed
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Generate password reset URL
 * @param {string} token - Password reset token
 * @returns {string} - Full password reset URL
 */
function generatePasswordResetUrl(token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl}/reset-password?token=${token}`;
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  createTransporter,
  generateVerificationUrl,
  generatePasswordResetUrl
};
