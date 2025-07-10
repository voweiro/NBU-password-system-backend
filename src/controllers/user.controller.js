const UserModel = require('../models/user.model');
const ActivityModel = require('../models/activity.model');
const emailService = require('../services/email.service');
const crypto = require('crypto');

class UserController {
    static async getAllUsers(req, res, next) {
        try {
            const users = await UserModel.getAllUsers();
            res.json({
                success: true,
                data: users.map(user => {
                    delete user.password;
                    return user;
                })
            });
        } catch (error) {
            next(error);
        }
    }

    static async createUser(req, res, next) {
        try {
            // Generate a temporary password if not provided
            let temporaryPassword = req.body.password;
            let passwordGenerated = false;
            
            if (!temporaryPassword) {
                temporaryPassword = crypto.randomBytes(8).toString('hex');
                passwordGenerated = true;
            }

            // Create user with the password
            const userData = {
                ...req.body,
                password: temporaryPassword
            };
            
            const user = await UserModel.create(userData);
            
            // Log user creation activity
            await ActivityModel.log(
                req.user.id,
                'USER_CREATED',
                { createdUserId: user.id, email: user.email },
                req.ip
            );

            // Send welcome email with login credentials
            try {
                const emailResult = await emailService.sendWelcomeEmail(
                    user.email,
                    user.full_name,
                    temporaryPassword
                );
                
                if (emailResult.success) {
                    await ActivityModel.log(
                        req.user.id,
                        'WELCOME_EMAIL_SENT',
                        { 
                            recipientEmail: user.email, 
                            messageId: emailResult.messageId,
                            passwordGenerated: passwordGenerated
                        },
                        req.ip
                    );
                } else {
                    console.warn('Failed to send welcome email:', emailResult.message);
                }
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Don't fail user creation if email fails
            }

            // Remove password from response
            delete user.password;
            
            res.status(201).json({
                success: true,
                data: user,
                message: passwordGenerated 
                    ? 'User created successfully. Login credentials have been sent via email.'
                    : 'User created successfully with provided password. Login credentials have been sent via email.'
            });
        } catch (error) {
            next(error);
        }
    }

    static async getUser(req, res, next) {
        try {
            const user = await UserModel.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Only allow users to view their own profile unless they're super_admin or ultra_admin
            if (req.user.id !== user.id && !['super_admin', 'ultra_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this user'
                });
            }

            delete user.password;
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateUser(req, res, next) {
        try {
            const user = await UserModel.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Only allow users to update their own profile unless they're super_admin or ultra_admin
            if (req.user.id !== user.id && !['super_admin', 'ultra_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this user'
                });
            }

            const updatedUser = await UserModel.update(req.params.id, req.body);
            await ActivityModel.log(
                req.user.id,
                'USER_UPDATED',
                { updatedUserId: updatedUser.id },
                req.ip
            );

            delete updatedUser.password;
            res.json({
                success: true,
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteUser(req, res, next) {
        try {
            const user = await UserModel.delete(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            await ActivityModel.log(
                req.user.id,
                'USER_DELETED',
                { deletedUserId: user.id, email: user.email },
                req.ip
            );

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = UserController;