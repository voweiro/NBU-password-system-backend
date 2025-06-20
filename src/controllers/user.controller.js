const UserModel = require('../models/user.model');
const ActivityModel = require('../models/activity.model');

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
            const user = await UserModel.create(req.body);
            await ActivityModel.log(
                req.user.id,
                'USER_CREATED',
                { createdUserId: user.id, email: user.email },
                req.ip
            );

            delete user.password;
            res.status(201).json({
                success: true,
                data: user
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