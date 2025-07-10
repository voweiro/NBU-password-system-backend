const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Configure email transporter based on environment variables
            if (process.env.EMAIL_SERVICE === 'gmail') {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
                    }
                });
            } else if (process.env.EMAIL_SERVICE === 'smtp') {
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });
            } else {
                // Default to Ethereal Email for testing
                this.createTestAccount();
            }
        } catch (error) {
            logger.error('Failed to initialize email transporter:', error);
        }
    }

    async createTestAccount() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            logger.info('Using Ethereal Email for testing:', {
                user: testAccount.user,
                pass: testAccount.pass
            });
        } catch (error) {
            logger.error('Failed to create test email account:', error);
        }
    }

    async sendWelcomeEmail(userEmail, fullName, temporaryPassword) {
        if (!this.transporter) {
            logger.warn('Email transporter not configured. Skipping email send.');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@passwordmanager.com',
                to: userEmail,
                subject: 'Welcome to Password Management System - Your Login Credentials',
                html: this.generateWelcomeEmailTemplate(fullName, userEmail, temporaryPassword)
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            logger.info('Welcome email sent successfully:', {
                to: userEmail,
                messageId: info.messageId
            });

            // Log preview URL for Ethereal Email
            if (process.env.EMAIL_SERVICE !== 'gmail' && process.env.EMAIL_SERVICE !== 'smtp') {
                logger.info('Preview URL: ' + nodemailer.getTestMessageUrl(info));
            }

            return { 
                success: true, 
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };
        } catch (error) {
            logger.error('Failed to send welcome email:', error);
            return { success: false, message: error.message };
        }
    }

    generateWelcomeEmailTemplate(fullName, email, temporaryPassword) {
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
                <p>Welcome to the Password Management System! Your account has been successfully created.</p>
                
                <div class="credentials-box">
                    <h3>🔑 Your Login Credentials</h3>
                    <div class="credential-item">
                        <strong>Email:</strong> ${email}
                    </div>
                    <div class="credential-item">
                        <strong>Temporary Password:</strong> ${temporaryPassword}
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

    async getTransporter() {
        if (!this.transporter) {
            this.initializeTransporter();
        }
        return this.transporter;
    }

    async verifyConnection() {
        try {
            const transporter = await this.getTransporter();
            if (!transporter) {
                throw new Error('Email transporter not configured');
            }
            await transporter.verify();
            
            return {
                success: true,
                message: 'Email service connection verified successfully',
                service: process.env.EMAIL_SERVICE || 'SMTP'
            };
        } catch (error) {
            logger.error('Email service verification failed:', error);
            return {
                success: false,
                error: error.message,
                message: 'Email service connection failed'
            };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;