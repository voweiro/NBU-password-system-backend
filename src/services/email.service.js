const nodemailer = require('nodemailer');

/**
 * Configure email transporter
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Email attachments
 */
exports.sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  // Add attachments if provided
  if (options.attachments && Array.isArray(options.attachments)) {
    mailOptions.attachments = options.attachments;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send welcome email to new users
 * @param {string} userEmail - User's email address
 * @param {string} fullName - User's full name
 * @param {string} temporaryPassword - Temporary password
 */
exports.sendWelcomeEmail = async (userEmail, fullName, temporaryPassword) => {
  const subject = 'Welcome to Password Management System - Your Login Credentials';
  
  const text = `
    Dear ${fullName},

    Welcome to the Nigerian British University Password Management System Your account has been successfully created.

    Your Login Credentials:
    Email: ${userEmail}
    Temporary Password: ${temporaryPassword}
    use this link to login: https://nbu-password-system-frontend.vercel.app
    Please note that this is a temporary password. You will be required to change it upon your first login.

    Important Security Notice:
    - Please change your password immediately after your first login
    - Do not share these credentials with anyone
    - This email contains sensitive information - please delete it after logging in

    Getting Started:
    1. Visit the Password Management System login page
    2. Enter your email and temporary password
    3. Change your password to something secure and memorable
    4. Start managing your system passwords securely

    If you have any questions or need assistance, please contact your system administrator.

    Best regards,
    Password Management System
  `;
  
  const html = generateWelcomeEmailTemplate(fullName, userEmail, temporaryPassword);
  
  return exports.sendEmail({ to: userEmail, subject, text, html });
};

/**
 * Generate HTML template for welcome email
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @param {string} temporaryPassword - Temporary password
 * @returns {string} HTML template
 */
function generateWelcomeEmailTemplate(fullName, email, temporaryPassword) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Password Management System</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #4f46e5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                }
                .credentials-box {
                    background-color: #fff;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .credential-item {
                    margin: 10px 0;
                    padding: 10px;
                    background-color: #f3f4f6;
                    border-radius: 4px;
                }
                .warning {
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    color: #92400e;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #6b7280;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔐 Welcome to Password Management System</h1>
            </div>
            <div class="content">
                <h2>Hello ${fullName},</h2>
                <p>Welcome to the Nigerian British Univeristy Password Management System Your account has been successfully created.</p>
                
                <div class="credentials-box">
                    <h3>🔑 Your Login Credentials</h3>
                    <div class="credential-item">
                        <strong>Email:</strong> ${email}
                    </div>
                    <div class="credential-item">
                        <strong>Temporary Password:</strong> ${temporaryPassword}
                        <stron>   use this link to login: https://nbu-password-system-frontend.vercel.app</strong>
                    </div>
                </div>

                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul>
                        <li>Please change your password immediately after your first login</li>
                        <li>Do not share these credentials with anyone</li>
                        <li>This email contains sensitive information - please delete it after logging in</li>
                    </ul>
                </div>

                <h3>🚀 Getting Started</h3>
                <ol>
                    <li>Visit the Password Management System login page</li>
                    <li>Enter your email and temporary password</li>
                    <li>Change your password to something secure and memorable</li>
                    <li>Start managing your system passwords securely</li>
                </ol>

                <p>If you have any questions or need assistance, please contact your system administrator.</p>

                <div class="footer">
                    <p>This is an automated message from the Password Management System.<br>
                    Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
}