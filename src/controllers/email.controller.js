const emailService = require('../services/email.service');
const ActivityModel = require('../models/activity.model');

class EmailController {
    static async testEmailService(req, res, next) {
        try {
            // Only allow super_admin and ultra_admin to test email service
            if (!['super_admin', 'ultra_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to test email service'
                });
            }

            const verificationResult = await emailService.verifyConnection();
            
            await ActivityModel.log(
                req.user.id,
                'EMAIL_SERVICE_TEST',
                { result: verificationResult },
                req.ip
            );

            res.json({
                success: true,
                data: verificationResult
            });
        } catch (error) {
            next(error);
        }
    }

    static async sendTestEmail(req, res, next) {
        try {
            // Only allow super_admin and ultra_admin to send test emails
            if (!['super_admin', 'ultra_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to send test emails'
                });
            }

            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email address is required'
                });
            }

            const emailResult = await emailService.sendWelcomeEmail(
                email,
                'Test User',
                'TestPassword123'
            );

            await ActivityModel.log(
                req.user.id,
                'TEST_EMAIL_SENT',
                { 
                    recipientEmail: email,
                    result: emailResult
                },
                req.ip
            );

            res.json({
                success: true,
                data: emailResult,
                message: emailResult.success 
                    ? 'Test email sent successfully'
                    : 'Failed to send test email'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = EmailController;